import { CHARACTER_SET } from "./GlyphAtlasTexture.js";

/**
 * Samples particle targets from *live DOM text*, character by character.
 *
 * Every character's on-screen box is measured with Range.getClientRects(), then
 * redrawn offscreen with the element's computed font at that exact position.
 * Particles that settle on these targets sit precisely on top of the real
 * HTML heading, so the particle -> DOM crossfade is seamless (wrapping,
 * letter-spacing and text-transform are all honoured because the browser did
 * the layout).
 */
export class DomTextSampler {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  /**
   * @param {Element[]} elements  elements with a `data-tone` attribute (0 accent, 1 white, 2 dim)
   * @param {number} count        number of targets to return
   * @param {{width:number,height:number}} viewport
   */
  sample(elements, count, viewport) {
    const scale = 2;
    this.stats = { characters: 0, candidates: 0, bounds: null };
    const chars = [];
    elements.forEach((element, elementIndex) => this.collectCharacters(element, elementIndex, chars));
    if (chars.length === 0) return this.fallback(count);

    // offscreen canvas covers only the union of the character boxes
    const pad = 12;
    const minX = Math.min(...chars.map((c) => c.left)) - pad;
    const minY = Math.min(...chars.map((c) => c.top)) - pad;
    const maxX = Math.max(...chars.map((c) => c.right)) + pad;
    const maxY = Math.max(...chars.map((c) => c.bottom)) + pad;
    const width = Math.ceil((maxX - minX) * scale);
    const height = Math.ceil((maxY - minY) * scale);
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.context;
    ctx.clearRect(0, 0, width, height);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    chars.forEach((c, order) => {
      c.order = order;
      ctx.font = c.font.replace(/(\d+(\.\d+)?)px/, (m, px) => `${parseFloat(px) * scale}px`);
      const metrics = ctx.measureText(c.char);
      const ascent = metrics.fontBoundingBoxAscent ?? c.fontSize * 0.8 * scale;
      // element id is encoded in the red/green ratio so anti-aliased edges keep it
      ctx.fillStyle = `rgb(${(c.elementIndex + 1) * 40}, 255, 0)`;
      ctx.fillText(c.char, (c.left - minX) * scale, (c.top - minY) * scale + ascent);
      c.box = {
        x1: (c.left - minX) * scale,
        x2: (c.right - minX) * scale,
        y1: (c.top - minY) * scale,
        y2: (c.bottom - minY) * scale,
      };
    });

    const data = ctx.getImageData(0, 0, width, height).data;
    const candidates = [];
    const cumulative = [];
    let total = 0;
    const step = 2;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const g = data[i + 1];
        if (g < 70) continue;
        const elementIndex = Math.round(((data[i] / g) * 255) / 40) - 1;
        const element = elements[elementIndex];
        if (!element) continue;
        const char = this.charAt(chars, elementIndex, x, y);
        const size = this.particleSizeFor(char ? char.fontSize : 24);
        // smaller particles need proportionally more samples for even coverage
        const weight = (g / 255) * Math.pow(8.5 / size, 0.9);
        total += weight;
        cumulative.push(total);
        candidates.push({
          x: minX + x / scale,
          y: minY + y / scale,
          tone: Number(element.dataset.tone ?? 1),
          size,
          char,
        });
      }
    }

    if (candidates.length === 0) return this.fallback(count);

    const totalChars = Math.max(1, chars.length);
    const points = new Array(count);
    for (let n = 0; n < count; n++) {
      const c = this.pick(candidates, cumulative, total);
      const order = c.char ? c.char.order / totalChars : Math.random();
      points[n] = {
        x: c.x + (Math.random() - 0.5) * 0.8 - viewport.width / 2,
        y: viewport.height / 2 - (c.y + (Math.random() - 0.5) * 0.8),
        tone: c.tone,
        size: c.size * (0.85 + Math.random() * 0.3),
        delay: order * 0.62 + Math.random() * 0.14,
        glyphIndex: c.char ? CHARACTER_SET.indexOf(c.char.char) : -1,
        order,
      };
    }

    this.stats = { characters: chars.length, candidates: candidates.length, bounds: { minX, minY, maxX, maxY } };
    return points;
  }

  collectCharacters(element, elementIndex, out) {
    const style = getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const upper = style.textTransform === "uppercase";
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const range = document.createRange();

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent;
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue;
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = [...range.getClientRects()].find((r) => r.width > 0);
        if (!rect) continue;
        out.push({
          char: upper ? text[i].toUpperCase() : text[i],
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          font,
          fontSize,
          elementIndex,
        });
      }
    }
    range.detach?.();
  }

  charAt(chars, elementIndex, x, y) {
    let best = null;
    let bestDist = Infinity;
    for (const c of chars) {
      if (c.elementIndex !== elementIndex) continue;
      const b = c.box;
      if (y < b.y1 - 4 || y > b.y2 + 4) continue;
      if (x >= b.x1 && x <= b.x2) return c;
      const d = Math.min(Math.abs(x - b.x1), Math.abs(x - b.x2));
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }

  particleSizeFor(fontSize) {
    return Math.max(3.4, Math.min(8.5, fontSize * 0.06));
  }

  pick(candidates, cumulative, total) {
    const value = Math.random() * total;
    let low = 0;
    let high = cumulative.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (cumulative[mid] < value) low = mid + 1;
      else high = mid;
    }
    return candidates[low];
  }

  fallback(count) {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 120,
      tone: 1,
      size: 6,
      delay: Math.random(),
      glyphIndex: -1,
      order: Math.random(),
    }));
  }
}
