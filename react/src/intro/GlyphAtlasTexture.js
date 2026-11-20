import * as THREE from "three";

export const CHARACTER_SET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz{}[]()<>+-=*/%!@#$^&:;\\/._|?~,";

/** Characters that dominate the "code ocean" so it reads as source code, not noise. */
export const FREQUENT_CHARACTERS = "01{}<>/;=AI";

export const ATLAS_FONT = "800 40px 'JetBrains Mono', monospace";

/**
 * Renders every glyph once, in white, into a texture atlas.
 * Colour is applied per particle in the shader, so one atlas serves every tone.
 */
export class GlyphAtlasTexture {
  constructor() {
    this.cellSize = 64;
    this.columns = 12;
    this.rows = Math.ceil(CHARACTER_SET.length / this.columns);
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.columns * this.cellSize;
    this.canvas.height = this.rows * this.cellSize;
    this.context = this.canvas.getContext("2d");
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.flipY = false;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.frequentIndices = [...FREQUENT_CHARACTERS].map((ch) => CHARACTER_SET.indexOf(ch));
    this.build();
  }

  get count() {
    return CHARACTER_SET.length;
  }

  indexOf(char) {
    return CHARACTER_SET.indexOf(char);
  }

  build() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = ATLAS_FONT;

    for (let index = 0; index < CHARACTER_SET.length; index++) {
      const x = (index % this.columns) * this.cellSize + this.cellSize / 2;
      const y = Math.floor(index / this.columns) * this.cellSize + this.cellSize / 2;

      // soft halo, then a crisp core on top
      ctx.save();
      ctx.shadowColor = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(CHARACTER_SET[index], x, y + 1);
      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(CHARACTER_SET[index], x, y + 1);
    }

    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}
