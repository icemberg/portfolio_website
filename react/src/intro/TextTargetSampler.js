import { CHARACTER_SET } from "./GlyphAtlasTexture.js";

export class TextTargetSampler {
  constructor() {
    this.canvas = this.createWorkCanvas(1, 1);
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  sample(lines, count, {
    x = 0,
    y = 0,
    width = 600,
    height = 220,
    titleSize = 72,
    bodySize = 28,
    lineHeight = 48,
    align = "center",
    bubble = false,
  } = {}) {
    const scale = 2;
    this.canvas.width = Math.ceil(width * scale);
    this.canvas.height = Math.ceil(height * scale);
    const ctx = this.context;
    const horizontalPadding = (bubble ? 34 : 18) * scale;
    const verticalPadding = (bubble ? 30 : 16) * scale;
    const fitted = this.fitTypography(ctx, lines, {
      width: this.canvas.width - horizontalPadding * 2,
      height: this.canvas.height - verticalPadding * 2,
      titleSize: titleSize * scale,
      bodySize: bodySize * scale,
      lineHeight: lineHeight * scale,
      bubble,
    });

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = align;
    ctx.textBaseline = "middle";

    if (bubble) {
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.lineWidth = 2.2 * scale;
      ctx.strokeStyle = "#ff0000";
      // square terminal frame (the portfolio uses hard edges everywhere)
      this.roundedRect(ctx, 8 * scale, 8 * scale, this.canvas.width - 16 * scale, this.canvas.height - 16 * scale, 0);
      ctx.stroke();
      // header rule, like a terminal title bar
      ctx.beginPath();
      ctx.moveTo(8 * scale, 30 * scale);
      ctx.lineTo(this.canvas.width - 8 * scale, 30 * scale);
      ctx.stroke();
      this.bubblePointer(ctx, 9 * scale, this.canvas.height * 0.55, 24 * scale, 18 * scale);
      ctx.restore();
    }

    const anchorX = align === "left" ? horizontalPadding : this.canvas.width / 2;
    const headerOffset = bubble ? 11 * scale : 0;
    const firstY = this.canvas.height / 2 + headerOffset - ((lines.length - 1) * fitted.lineHeight) / 2;
    const characterBoxes = [];
    let characterOrder = 0;

    for (let i = 0; i < lines.length; i++) {
      ctx.font = this.fontForLine(i, bubble, fitted.titleSize, fitted.bodySize);
      ctx.fillStyle = "#00ff00";
      ctx.fillText(lines[i], anchorX, firstY + i * fitted.lineHeight);
      this.measureCharacters(ctx, lines[i], {
        align,
        anchorX,
        centerY: firstY + i * fitted.lineHeight,
        fontSize: i === 0 && !bubble ? fitted.titleSize : fitted.bodySize,
        lineHeight: fitted.lineHeight,
        lineIndex: i,
        startOrder: characterOrder,
        boxes: characterBoxes,
      });
      characterOrder += lines[i].length + 1;
    }

    if (bubble) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#0000ff";
      const cursorX = this.cursorX(ctx, lines, anchorX, firstY, fitted, bubble);
      const cursorY = firstY + (lines.length - 1) * fitted.lineHeight;
      // block cursor
      ctx.fillRect(cursorX + 6 * scale, cursorY - fitted.bodySize * 0.46, fitted.bodySize * 0.5, fitted.bodySize * 0.92);
      ctx.restore();
    }

    return this.sampleOpaquePixels(count, x, y, width, height, scale, {
      bubble,
      characterBoxes,
      totalCharacters: Math.max(1, characterOrder),
    });
  }

  fitTypography(ctx, lines, { width, height, titleSize, bodySize, lineHeight, bubble }) {
    let fittedTitle = titleSize;
    let fittedBody = bodySize;
    let fittedLineHeight = lineHeight;

    for (let attempt = 0; attempt < 24; attempt++) {
      let maxLineWidth = 0;
      for (let i = 0; i < lines.length; i++) {
        ctx.font = this.fontForLine(i, bubble, fittedTitle, fittedBody);
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(lines[i]).width);
      }

      const blockHeight = fittedBody + Math.max(0, lines.length - 1) * fittedLineHeight;
      if (maxLineWidth <= width && blockHeight <= height) break;

      fittedTitle *= 0.94;
      fittedBody *= 0.94;
      fittedLineHeight *= 0.94;
    }

    return {
      titleSize: fittedTitle,
      bodySize: fittedBody,
      lineHeight: fittedLineHeight,
    };
  }

  fontForLine(index, bubble, titleSize, bodySize) {
    const size = index === 0 && !bubble ? titleSize : bodySize;
    return `800 ${size}px 'JetBrains Mono', monospace`;
  }

  sampleOpaquePixels(count, originX, originY, width, height, scale, { bubble, characterBoxes, totalCharacters }) {
    const data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    const candidates = [];
    const cumulative = [];
    let total = 0;

    for (let y = 1; y < this.canvas.height - 1; y += 2) {
      for (let x = 1; x < this.canvas.width - 1; x += 2) {
        const index = (y * this.canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = Math.max(r, g, b) / 255;
        if (alpha < 0.08) continue;

        const region = this.regionFromPixel(r, g, b);
        const edge = this.isAlphaEdge(data, x, y) ? 1 : 0;
        const charBox = region === "textCharacters" ? (this.findCharacterBox(characterBoxes, x, y) || this.findNearestCharacterBox(characterBoxes, x, y)) : null;
        const charDelay = charBox ? charBox.order / totalCharacters : 0;
        const regionBoost = region === "textCharacters" ? 4.5 : region === "textCursor" ? 2.0 : 0.7;
        const weight = 0.38 + alpha * 2 + edge * 2.4 + regionBoost;
        total += weight;
        candidates.push({ x, y, alpha, edge, region, charBox, charDelay });
        cumulative.push(total);
      }
    }

    const points = new Array(count);
    for (let i = 0; i < count; i++) {
      const candidate = this.pick(candidates, cumulative, total);
      const localX = candidate.x / scale - width / 2;
      const localY = height / 2 - candidate.y / scale;
      const delay = this.delayForTarget(candidate, bubble);
      points[i] = {
        x: originX + localX,
        y: originY + localY,
        brightness: candidate.alpha,
        edge: candidate.edge,
        delay,
        sizeBoost: candidate.edge ? 1.28 : 1.12,
        region: candidate.region,
        // 0 = magenta accent (frame, cursor), 1 = white (letters)
        tone: candidate.region === "textCharacters" ? 1 : 0,
        glyphIndex: this.glyphIndexFor(candidate.charBox?.char),
        charOrder: candidate.charBox?.order || 0,
      };
    }

    return points;
  }

  pick(candidates, cumulative, total) {
    if (candidates.length === 0) {
      return { x: this.canvas.width / 2, y: this.canvas.height / 2, alpha: 1, edge: 0 };
    }

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

  isAlphaEdge(data, x, y) {
    const w = this.canvas.width;
    const current = (y * w + x) * 4;
    const center = Math.max(data[current], data[current + 1], data[current + 2]) > 32;
    return (
      (Math.max(data[(y * w + x - 1) * 4], data[(y * w + x - 1) * 4 + 1], data[(y * w + x - 1) * 4 + 2]) > 32) !== center ||
      (Math.max(data[(y * w + x + 1) * 4], data[(y * w + x + 1) * 4 + 1], data[(y * w + x + 1) * 4 + 2]) > 32) !== center ||
      (Math.max(data[((y - 1) * w + x) * 4], data[((y - 1) * w + x) * 4 + 1], data[((y - 1) * w + x) * 4 + 2]) > 32) !== center ||
      (Math.max(data[((y + 1) * w + x) * 4], data[((y + 1) * w + x) * 4 + 1], data[((y + 1) * w + x) * 4 + 2]) > 32) !== center
    );
  }

  roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  bubblePointer(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - width, y + height * 0.58);
    ctx.lineTo(x + 4, y + height);
    ctx.stroke();
  }

  measureCharacters(ctx, text, { align, anchorX, centerY, fontSize, lineHeight, startOrder, boxes }) {
    const textWidth = ctx.measureText(text).width;
    let cursorX = align === "center" ? anchorX - textWidth / 2 : anchorX;
    const top = centerY - lineHeight * 0.48;
    const bottom = centerY + lineHeight * 0.48;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;
      if (char.trim()) {
        boxes.push({
          char,
          order: startOrder + i,
          x1: cursorX,
          x2: cursorX + charWidth,
          y1: top - fontSize * 0.08,
          y2: bottom + fontSize * 0.08,
        });
      }
      cursorX += charWidth;
    }
  }

  cursorX(ctx, lines, anchorX, firstY, fitted, bubble) {
    const lastLine = lines[lines.length - 1] || "";
    ctx.font = this.fontForLine(lines.length - 1, bubble, fitted.titleSize, fitted.bodySize);
    return anchorX + ctx.measureText(lastLine).width;
  }

  regionFromPixel(r, g, b) {
    if (b > r && b > g) return "textCursor";
    if (g >= r && g >= b) return "textCharacters";
    return "textBubble";
  }

  findCharacterBox(boxes, x, y) {
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2) return box;
    }
    return null;
  }

  findNearestCharacterBox(boxes, x, y) {
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (y < box.y1 - 8 || y > box.y2 + 8) continue;
      const cx = (box.x1 + box.x2) / 2;
      const dist = Math.abs(x - cx);
      if (dist < bestDist) {
        bestDist = dist;
        best = box;
      }
    }
    const charWidth = boxes.length > 0 ? (boxes[0].x2 - boxes[0].x1) : 50;
    return bestDist < charWidth * 0.8 ? best : null;
  }

  delayForTarget(candidate, bubble) {
    if (!bubble) return Math.random();
    if (candidate.region === "textBubble") return Math.random() * 0.18;
    if (candidate.region === "textCursor") return 0.9 + Math.random() * 0.08;
    return 0.22 + candidate.charDelay * 0.66 + Math.random() * 0.08;
  }

  glyphIndexFor(char) {
    if (!char) return -1;
    const index = CHARACTER_SET.indexOf(char);
    return index >= 0 ? index : -1;
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
}
