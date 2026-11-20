/** Arm joints in crop u/v space (measured on avatar1.png, middle panel). */
export const ARM_RIG = {
  elbow: { u: 0.11, v: 0.84 },
  wrist: { u: 0.18, v: 0.585 },
  fingertip: { u: 0.17, v: 0.3 },
};

/**
 * Thumb as a capsule (centre line base -> tip, radius in source pixels), fitted
 * on the source art: it hugs the diagonal thumb and its rounded tip stops just
 * short of the hood outline.
 */
const THUMB = {
  base: { u: 0.24, v: 0.528 },
  tip: { u: 0.284, v: 0.446 },
  radius: 9,
};

/** Numeric region ids consumed by the particle vertex shader. */
export const REGION_CODES = {
  hood: 0,
  face: 1,
  hair: 2,
  eyes: 3,
  glasses: 4,
  body: 5,
  rightHand: 6,
  rightForearm: 7,
  rightUpperArm: 8,
};

export class AvatarMaskGenerator {
  constructor({
    imageUrl = "images/avatar1.png",
    crop = null,
    sampleWidth = 520,
    sampleHeight = 430,
    // avatar1.png is a 3-panel sheet; anything right of this fraction of the
    // sheet belongs to panel 3's raised arm and showed up as a stray sliver.
    rightLimit = 0.643,
  } = {}) {
    this.imageUrl = imageUrl;
    this.crop = crop;
    this.rightLimit = rightLimit;
    this.sourceWidth = 1;
    this.sampleWidth = sampleWidth;
    this.sampleHeight = sampleHeight;
    this.canvas = this.createWorkCanvas(sampleWidth, sampleHeight);
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.candidates = [];
    this.cumulativeWeights = [];
    this.totalWeight = 0;
    this.stats = {
      source: imageUrl,
      crop: null,
      candidates: 0,
      edges: 0,
      regionCounts: {},
      edgeRegionCounts: {},
      handBounds: null,
    };
  }

  async load() {
    const image = await this.loadImage(this.imageUrl);
    const source = this.crop || this.detectBestAvatarCrop(image);
    this.stats.crop = { ...source };
    this.sourceWidth = image.naturalWidth || image.width;
    this.context.clearRect(0, 0, this.sampleWidth, this.sampleHeight);
    this.context.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      0,
      0,
      this.sampleWidth,
      this.sampleHeight,
    );
    this.analyze();
  }

  sample(count, worldWidth, worldHeight) {
    if (this.candidates.length === 0) {
      return this.fallbackTargets(count, worldWidth, worldHeight);
    }

    const targets = new Array(count);
    const avatarWidth = worldWidth;
    const avatarHeight = worldHeight;

    // Weighted sampling *without* replacement (Efraimidis-Spirakis keys): bright /
    // edge pixels are preferred, but no pixel is stacked many times over, which
    // is what blew the face out to white under additive blending.
    const ranked = this.candidates
      .map((candidate) => ({ candidate, key: Math.pow(Math.random(), 1 / candidate.weight) }))
      .sort((a, b) => b.key - a.key);

    for (let i = 0; i < count; i++) {
      const pass = Math.floor(i / ranked.length);
      const candidate = ranked[i % ranked.length].candidate;
      const spread = pass === 0 ? 0.9 : 1.6;
      const jitterX = (Math.random() - 0.5) * spread;
      const jitterY = (Math.random() - 0.5) * spread;
      const nx = (candidate.x + jitterX) / this.sampleWidth - 0.5;
      const ny = (candidate.y + jitterY) / this.sampleHeight - 0.5;
      const skin = this.skinWeights(nx + 0.5, ny + 0.5, candidate.region);

      targets[i] = {
        x: nx * avatarWidth,
        y: -ny * avatarHeight,
        nx,
        ny,
        brightness: candidate.brightness,
        edge: candidate.edge,
        region: candidate.region,
        code: REGION_CODES[candidate.region] ?? 0,
        skin,
        delay: this.regionDelay(candidate.region) + Math.random() * 0.18,
        sizeBoost: candidate.edge > 0 ? 1.16 : 0.92 + candidate.brightness * 0.18,
      };
    }

    this.shuffle(targets);
    return targets;
  }

  analyze() {
    const imageData = this.context.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
    const data = imageData.data;
    const mask = new Uint8Array(this.sampleWidth * this.sampleHeight);
    const luma = new Float32Array(this.sampleWidth * this.sampleHeight);

    for (let y = 0; y < this.sampleHeight; y++) {
      for (let x = 0; x < this.sampleWidth; x++) {
        const offset = (y * this.sampleWidth + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        luma[y * this.sampleWidth + x] = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
      }
    }

    for (let y = 1; y < this.sampleHeight - 1; y++) {
      for (let x = 1; x < this.sampleWidth - 1; x++) {
        const offset = (y * this.sampleWidth + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const brightness = (r + g + b) / 765;
        const u = x / this.sampleWidth;
        const v = y / this.sampleHeight;
        const cyanDominance = (g + b - r * 0.95) / 510;
        const localGlow = Math.max(r, g, b) / 255;
        const center = luma[y * this.sampleWidth + x];
        const gradient =
          Math.abs(center - luma[y * this.sampleWidth + x - 1]) +
          Math.abs(center - luma[y * this.sampleWidth + x + 1]) +
          Math.abs(center - luma[(y - 1) * this.sampleWidth + x]) +
          Math.abs(center - luma[(y + 1) * this.sampleWidth + x]);
        const region = this.classifyRegion(u, v);
        // the face is drawn from strokes only: the source art lights the right
        // cheek brightly, and filling it produced a solid white patch
        const featureRegion =
          region === "eyes" ||
          region === "glasses" ||
          region === "hair" ||
          region === "rightHand";
        const stroke = localGlow > 0.2 && brightness > 0.1 && cyanDominance > 0.04 && gradient > 0.055;
        const featureFill = featureRegion && localGlow > 0.44 && brightness > 0.22 && cyanDominance > 0.06 && gradient > 0.018;
        const sourceX = this.stats.crop.x + u * this.stats.crop.width;
        const insideSheetPanel = sourceX < this.sourceWidth * this.rightLimit;
        const active =
          insideSheetPanel &&
          this.isInsideAvatarEnvelope(u, v) &&
          (stroke || featureFill);
        mask[y * this.sampleWidth + x] = active ? 1 : 0;
      }
    }

    this.candidates.length = 0;
    this.cumulativeWeights.length = 0;
    this.totalWeight = 0;
    this.stats.candidates = 0;
    this.stats.edges = 0;
    this.stats.regionCounts = {};
    this.stats.edgeRegionCounts = {};
    const handBounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    for (let y = 2; y < this.sampleHeight - 2; y++) {
      for (let x = 2; x < this.sampleWidth - 2; x++) {
        if (!mask[y * this.sampleWidth + x]) continue;

        const offset = (y * this.sampleWidth + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const brightness = Math.min(1, Math.max(r, g, b) / 190);
        const edge = this.isEdge(mask, x, y) ? 1 : 0;
        const region = this.classifyRegion(x / this.sampleWidth, y / this.sampleHeight);
        const weight = this.weightFor(region, brightness, edge);

        this.totalWeight += weight;
        this.candidates.push({ x, y, brightness, edge, region, weight });
        this.cumulativeWeights.push(this.totalWeight);
        this.stats.candidates++;
        this.stats.regionCounts[region] = (this.stats.regionCounts[region] || 0) + 1;

        if (edge) {
          this.stats.edges++;
          this.stats.edgeRegionCounts[region] = (this.stats.edgeRegionCounts[region] || 0) + 1;
        }

        if (region === "rightHand") {
          handBounds.minX = Math.min(handBounds.minX, x);
          handBounds.maxX = Math.max(handBounds.maxX, x);
          handBounds.minY = Math.min(handBounds.minY, y);
          handBounds.maxY = Math.max(handBounds.maxY, y);
        }
      }
    }

    this.stats.handBounds = Number.isFinite(handBounds.minX) ? handBounds : null;
  }

  isInsideAvatarEnvelope(u, v) {
    const hand = u > 0.02 && u < 0.34 && v > 0.22 && v < 0.68;
    const arm = u > 0.08 && u < 0.40 && v > 0.46 && v < 0.92;
    const hoodHead =
      u > 0.34 &&
      u < 0.94 &&
      v > 0.02 &&
      v < 0.86 &&
      Math.abs(u - 0.64) < 0.1 + Math.sin(Math.min(1, v / 0.86) * Math.PI) * 0.25;
    const torso = u > 0.25 && u < 0.98 && v > 0.55 && v < 0.99;

    return hand || arm || hoodHead || torso;
  }

  handBoundaryU(v) {
    if (v < 0.38 || v > 0.54) return 0.34;
    const t = (v - 0.38) / 0.16;
    return 0.34 - 0.03 * Math.sin(t * Math.PI);
  }

  pickCandidate() {
    const value = Math.random() * this.totalWeight;
    let low = 0;
    let high = this.cumulativeWeights.length - 1;

    while (low < high) {
      const mid = (low + high) >> 1;
      if (this.cumulativeWeights[mid] < value) low = mid + 1;
      else high = mid;
    }

    return this.candidates[low];
  }

  isEdge(mask, x, y) {
    const w = this.sampleWidth;
    const index = y * w + x;
    return (
      mask[index - 1] !== mask[index] ||
      mask[index + 1] !== mask[index] ||
      mask[index - w] !== mask[index] ||
      mask[index + w] !== mask[index]
    );
  }

  /**
   * Region map measured on the cropped middle panel of avatar1.png (u,v in 0..1).
   * The raised hand ends at u≈0.30 (thumb tip); the hood outline starts at u≈0.31,
   * so the hand boundary must stay left of it or hood pixels wave with the hand.
   */
  classifyRegion(u, v) {
    // Palm + fingers stop at u≈0.285 (the hood outline starts at u≈0.304);
    // the diagonal thumb is matched by a rounded capsule so its tip is cropped
    // along its real curve instead of by a straight cut.
    const palmRight = v < 0.54 ? 0.285 : 0.245;
    const palm = u > 0.06 && u < palmRight && v > 0.28 && v < 0.6;
    if (palm || this.inThumb(u, v)) return "rightHand";
    if (u > 0.04 && u < 0.255 && v >= 0.6 && v < 0.86) return "rightForearm";
    if (u < 0.3 && v >= 0.86) return "rightUpperArm";     // elbow / sleeve end, kept still

    const leftLens = u > 0.375 && u < 0.505 && v > 0.325 && v < 0.435;
    const rightLens = u > 0.525 && u < 0.655 && v > 0.325 && v < 0.435;
    const bridge = u >= 0.505 && u <= 0.525 && v > 0.345 && v < 0.39;
    const leftEye = u > 0.415 && u < 0.475 && v > 0.355 && v < 0.415;
    const rightEye = u > 0.555 && u < 0.615 && v > 0.355 && v < 0.415;
    if (leftEye || rightEye) return "eyes";
    if (leftLens || rightLens || bridge) return "glasses";
    if (u > 0.37 && u < 0.665 && v > 0.29 && v < 0.6) return "face";
    if (v < 0.3 && u > 0.33 && u < 0.72) return "hair";
    if (v > 0.58) return "body";
    return "hood";
  }

  /** True inside the thumb capsule (distance measured in source pixels, so it stays round). */
  inThumb(u, v) {
    const cw = this.stats.crop?.width || 512;
    const ch = this.stats.crop?.height || 474;
    const { base, tip, radius } = THUMB;
    const ax = base.u * cw;
    const ay = base.v * ch;
    const dx = tip.u * cw - ax;
    const dy = tip.v * ch - ay;
    const px = u * cw - ax;
    const py = v * ch - ay;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - t * dx, py - t * dy) <= radius;
  }

  /**
   * 2D linear-blend-skinning weights for the waving arm.
   * Returns [forearm, hand]: forearm = how much the point follows the forearm's
   * rotation about the elbow; hand = how much it also follows the hand's
   * rotation about the wrist (applied first, hierarchically). Everything that
   * is not arm gets [0, 0] and never moves.
   */
  skinWeights(u, v, region) {
    if (region !== "rightHand" && region !== "rightForearm") return [0, 0];
    const { elbow, wrist, fingertip } = ARM_RIG;
    const project = (a, b) => {
      const dx = b.u - a.u;
      const dy = b.v - a.v;
      return ((u - a.u) * dx + (v - a.v) * dy) / (dx * dx + dy * dy);
    };
    const smooth = (e0, e1, x) => {
      const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    };
    const alongForearm = project(elbow, wrist);   // 0 at elbow, 1 at wrist
    const alongHand = project(wrist, fingertip);  // 0 at wrist, 1 at fingertips
    // sleeve stays attached near the elbow, then follows the forearm fully
    const forearm = region === "rightHand" ? 1 : smooth(0.08, 0.55, alongForearm);
    // blend across the wrist so the joint bends instead of tearing
    const hand = smooth(-0.06, 0.16, alongHand) * (region === "rightHand" ? 1 : 0.35);
    return [forearm, hand];
  }

  weightFor(region, brightness, edge) {
    const regionBoost = {
      rightHand: 2.2,
      rightForearm: 2.1,
      rightUpperArm: 1.5,
      eyes: 3.4,
      glasses: 3.0,
      face: 2.6,
      hair: 2.9,
      hood: 2.8,
      body: 1.55,
    }[region] || 1;

    return 0.22 + brightness * brightness * 2 + edge * 4.2 + regionBoost;
  }

  regionDelay(region) {
    return {
      hood: 0.02,
      face: 0.2,
      hair: 0.28,
      eyes: 0.42,
      glasses: 0.4,
      body: 0.54,
      rightUpperArm: 0.58,
      rightForearm: 0.62,
      rightHand: 0.66,
    }[region] || 0.3;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = array[i];
      array[i] = array[j];
      array[j] = tmp;
    }
  }

  fallbackTargets(count, worldWidth, worldHeight) {
    const targets = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      targets.push({
        x: Math.cos(a) * worldWidth * 0.25 * r,
        y: Math.sin(a) * worldHeight * 0.35 * r,
        nx: Math.cos(a) * 0.25 * r,
        ny: Math.sin(a) * 0.35 * r,
        brightness: 0.8,
        edge: 0,
        region: "face",
        code: REGION_CODES.face,
        skin: [0, 0],
        delay: Math.random() * 0.5,
        sizeBoost: 1,
      });
    }
    return targets;
  }

  detectBestAvatarCrop(image) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const panelWidth = sourceWidth / 3;
    const probe = this.createWorkCanvas(sourceWidth, sourceHeight);
    const probeContext = probe.getContext("2d", { willReadFrequently: true });
    probeContext.drawImage(image, 0, 0);
    const data = probeContext.getImageData(0, 0, sourceWidth, sourceHeight).data;
    const xStart = Math.floor(panelWidth);
    const xEnd = Math.floor(panelWidth * 2);
    let minX = xEnd;
    let maxX = xStart;
    let minY = sourceHeight;
    let maxY = 0;

    for (let y = 0; y < sourceHeight; y += 2) {
      for (let x = xStart; x < xEnd; x += 2) {
        const offset = (y * sourceWidth + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const brightness = (r + g + b) / 765;
        const cyanDominance = (g + b - r * 0.95) / 510;
        if (Math.max(r, g, b) > 54 && brightness > 0.12 && cyanDominance > 0.04) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (minX >= maxX || minY >= maxY) {
      return {
        x: panelWidth + panelWidth * 0.055,
        y: sourceHeight * 0.24,
        width: panelWidth * 0.9,
        height: sourceHeight * 0.6,
      };
    }

    const padX = Math.max(24, (maxX - minX) * 0.075);
    const padTop = Math.max(36, (maxY - minY) * 0.15);
    const padBottom = Math.max(46, (maxY - minY) * 0.22);
    let x = Math.max(xStart, minX - padX);
    let y = Math.max(0, minY - padTop);
    let width = Math.min(xEnd, maxX + padX) - x;
    let height = Math.min(sourceHeight, maxY + padBottom) - y;

    const desiredRatio = this.sampleWidth / this.sampleHeight;
    const currentRatio = width / height;
    if (currentRatio > desiredRatio) {
      const nextHeight = width / desiredRatio;
      y = Math.max(0, y - (nextHeight - height) * 0.42);
      height = Math.min(sourceHeight - y, nextHeight);
    } else {
      const nextWidth = height * desiredRatio;
      x = Math.max(xStart, x - (nextWidth - width) * 0.5);
      width = Math.min(xEnd - x, nextWidth);
    }

    return {
      x,
      y,
      width,
      height,
    };
  }

  createWorkCanvas(width, height) {
    if ("OffscreenCanvas" in window) {
      return new OffscreenCanvas(width, height);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load avatar source: ${url}`));
      image.src = url;
    });
  }
}
