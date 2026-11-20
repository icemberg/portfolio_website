import * as THREE from "three";
import { gsap } from "gsap";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { AvatarMaskGenerator, ARM_RIG } from "./AvatarMaskGenerator.js";
import { GlyphAtlasTexture, ATLAS_FONT } from "./GlyphAtlasTexture.js";
import { TextTargetSampler } from "./TextTargetSampler.js";
import { DomTextSampler } from "./DomTextSampler.js";

const MAX_RIPPLES = 6;
const ROLE_OCEAN = 0;
const ROLE_AVATAR = 1;
const ROLE_GREETING = 2;

/**
 * Timeline (seconds), matching the agreed phase plan:
 *   0-8 ocean · 8-11 vortex · 11-17 avatar forms · 18-22 wave · 22-29 greeting
 *   29-35 dissolve · 35-41 title · 41+ portfolio
 * The long run is deliberate: it covers the portfolio backend's load time. If
 * the data still isn't ready at HOLD, the intro waits on the greeting until
 * `setReady()` is called.
 */
const T = {
  oceanIn: 0,
  disturb: 8,
  reveal: 11,
  wave: 18,
  greet: 22,
  hold: 28.8,
  dissolve: 29,
  title: 35,
  handoff: 41,
  calm: 42.1,
};

/* ------------------------------------------------------------------ shaders */

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  attribute vec2 aHome;
  attribute vec4 aSeed;
  attribute float aRole;
  attribute vec4 aStage;   // xy target, z delay, w region code (avatar) | tone (greeting)
  attribute vec4 aStageB;  // x size, y brightness, z glyph (-1 random), w edge (avatar) | kind (greeting)
  attribute vec4 aTitle;   // xy target, z delay, w tone (-1 = not a title particle)
  attribute vec2 aTitleB;  // x size, y glyph
  attribute vec2 aSkin;    // arm skin weights: x forearm, y hand (0 = static body)

  uniform float uTime;
  uniform vec2 uViewport;
  uniform float uScale;
  uniform float uOceanIn;
  uniform float uDisturb;
  uniform float uReveal;
  uniform float uWave;
  uniform float uGreet;
  uniform float uDissolve;
  uniform float uTitle;
  uniform float uHandoff;
  uniform float uCalm;
  uniform float uFocus;
  uniform vec4 uFocusRect;  // cx, cy, rx, ry
  uniform vec3 uPointer;    // x, y, strength
  uniform vec4 uRipples[${MAX_RIPPLES}];
  uniform vec2 uElbow;
  uniform vec2 uWrist;
  uniform float uCols;
  uniform float uRows;
  uniform float uGlyphCount;
  uniform float uFreq[11];
  uniform vec3 uOceanLow;
  uniform vec3 uAccent;
  uniform vec3 uSoft;
  uniform vec3 uWhite;
  uniform vec3 uDim;

  varying vec2 vAtlas;
  varying vec3 vColor;
  varying float vAlpha;

  const float PI = 3.14159265;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  float easeInOut(float t) {
    t = clamp(t, 0.0, 1.0);
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
  }

  // per-particle progress window inside a 0..1 phase
  float stagger(float phase, float delay, float span) {
    return easeInOut((phase - delay * (1.0 - span)) / span);
  }

  vec2 curve(vec2 a, vec2 b, float t, float seed, float bend) {
    vec2 d = b - a;
    vec2 c = (a + b) * 0.5 + vec2(-d.y, d.x) * (seed - 0.5) * bend;
    float u = 1.0 - t;
    return u * u * a + 2.0 * u * t * c + t * t * b;
  }

  float randomGlyph(float seed, float rate) {
    float slot = floor(uTime * rate + seed * 17.0);
    float h = hash(seed * 91.7 + slot * 13.13);
    float glyph = floor(h * (uGlyphCount - 0.001));
    if (hash(seed * 37.1 + slot * 7.77) < 0.42) glyph = uFreq[int(floor(h * 10.999))];
    return glyph;
  }

  vec2 rotateAround(vec2 p, vec2 pivot, float a) {
    vec2 d = p - pivot;
    float s = sin(a), c = cos(a);
    return pivot + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
  }

  vec3 toneColor(float tone) {
    return tone < 0.5 ? uAccent : (tone < 1.5 ? uWhite : uDim);
  }

  void main() {
    float t = uTime;
    float tc = t * mix(1.0, 0.45, uCalm);

    /* ---------------- ocean ---------------- */
    vec2 home = aHome;
    float depth = clamp(0.5 - home.y / uViewport.y, 0.0, 1.0);          // 0 top -> 1 bottom
    // one dominant swell rolling toward the viewer, bent by a slow cross-current,
    // gives long crest lines instead of blotchy interference blobs
    float bendWave = sin(home.x * 0.0042 + tc * 0.31) * 46.0 + sin(home.x * 0.011 - tc * 0.23) * 14.0;
    float phase = (home.y + bendWave) * 0.026 + home.x * 0.004 + tc * 1.15;
    float swell = sin(phase) * 0.88 + sin(home.x * 0.019 - home.y * 0.007 - tc * 0.8) * 0.12;
    float crest = pow(smoothstep(0.5, 1.0, swell), 1.4);
    vec2 drift = vec2(sin(tc * 0.17) * 18.0 + sin(tc * 0.07) * 12.0, cos(tc * 0.15) * 10.0);
    vec2 o = home + drift
      + vec2(swell * 5.0, swell * (5.0 + depth * 9.0))
      + vec2(sin(tc * 0.7 + aSeed.z * 12.0), cos(tc * 0.6 + aSeed.w * 9.0)) * 2.2;

    float oSize = (5.6 + aSeed.y * 4.2) * (0.7 + depth * 0.55) * (1.0 + crest * 0.3) * uScale;
    float oBright = 0.12 + aSeed.z * 0.28 + crest * 0.6;
    float oAlpha = (0.14 + aSeed.w * 0.30) * (0.5 + depth * 0.65) + crest * 0.34;
    float energy = 0.0;

    if (uDisturb > 0.001) {
      float dist = length(o) + 0.001;
      vec2 dir = o / dist;
      float ring = sin(dist * 0.05 - t * 8.4);
      float rip = exp(-abs(dist - 140.0 * uScale - sin(t) * 36.0) / 95.0) * uDisturb;
      float vortex = exp(-(dist * dist) / (270.0 * 270.0 * uScale * uScale)) * uDisturb;
      float pull = vortex * smoothstep(0.16, 1.0, uDisturb);
      float swirl = sin(dist * 0.024 - t * 5.6) * vortex;
      o += dir * ring * rip * 46.0;
      o += vec2(-dir.y, dir.x) * swirl * 112.0 - dir * pull * 86.0;
      oAlpha += rip * 0.4;
      oSize += (rip * 3.5 + vortex * 2.0) * uScale;
      energy += rip * 0.6 + vortex * 0.3;
    }

    for (int r = 0; r < ${MAX_RIPPLES}; r++) {
      vec4 R = uRipples[r];
      float age = t - R.z;
      if (R.w <= 0.0 || age < 0.0 || age > 2.4) continue;
      float prog = age / 2.4;
      vec2 d = o - R.xy;
      float dist = length(d) + 0.001;
      float front = prog * 430.0 * uScale;
      float band = exp(-pow(dist - front, 2.0) / (3600.0 * uScale));
      float wv = sin(dist * 0.08 - prog * 24.0) * band * (1.0 - prog) * R.w;
      o += d / dist * wv * 36.0;
      oSize += abs(wv) * 3.0;
      oAlpha += abs(wv) * 0.25;
      energy += abs(wv) * 0.6;
    }

    if (uPointer.z > 0.01) {
      vec2 d = o - uPointer.xy;
      float dist = length(d) + 0.001;
      float f = (1.0 - smoothstep(0.0, 170.0 * uScale, dist)) * uPointer.z;
      o += d / dist * f * 64.0;
      oSize += f * 4.0;
      oAlpha += f * 0.3;
      energy += f * 0.7;
    }

    // boot: the field lights up from the centre outwards
    float boot = clamp(uOceanIn * 1.6 - length(home) / length(uViewport * 0.5) * 0.6, 0.0, 1.0);
    oAlpha *= boot;

    // dim the sea behind whatever is on stage so it stays legible
    vec2 fd = (o - uFocusRect.xy) / max(uFocusRect.zw, vec2(1.0));
    float hole = 1.0 - smoothstep(0.55, 1.2, length(fd));
    oAlpha *= mix(1.0, 0.5, uFocus) * (1.0 - uFocus * 0.8 * hole);
    oAlpha *= mix(1.0, 0.22, uCalm);  // quiet background behind the portfolio
    oAlpha = min(oAlpha, 1.0);

    vec3 oColor = mix(uOceanLow, uAccent, clamp(oBright + energy * 0.5, 0.0, 1.0) * 0.85);
    oColor = mix(oColor, uSoft, clamp(crest * 0.3 + energy * 0.45, 0.0, 0.8));
    float oGlyph = randomGlyph(aSeed.x, 0.55);
    float oRot = (aSeed.z - 0.5) * 0.6 + sin(t + aSeed.x * 6.283) * 0.2;

    vec2 pos = o;
    float size = oSize;
    float alpha = oAlpha;
    vec3 color = oColor;
    float glyph = oGlyph;
    float rot = oRot;

    /* ---------------- stage: avatar / greeting ---------------- */
    if (aRole > 0.5) {
      vec2 sp = aStage.xy;
      float sSize, sAlpha, k;
      vec3 sColor;
      float sGlyph = oGlyph;
      float sRot = 0.0;

      if (aRole < 1.5) {
        // One colour, one opacity for the whole avatar: features read through
        // particle density alone. The body is completely still (fixed glyph,
        // fixed rotation); only skinned arm particles move.
        sSize = (6.2 + aSeed.y * 4.8) * aStageB.x * 0.6 * uScale;
        sAlpha = 0.44 + aStageB.w * 0.06;
        sColor = uAccent * 0.92;
        sGlyph = floor(hash(aSeed.x * 13.7) * (uGlyphCount - 0.001));
        sRot = (aSeed.z - 0.5) * 0.4;

        // Hand wave = 2D linear blend skinning on an elbow -> wrist chain.
        // Hand rotates about the wrist (lagging the forearm = follow-through),
        // then the forearm rotates about the elbow and carries the hand with it.
        if (uWave > 0.001 && aSkin.x > 0.0) {
          float ph = t * 9.5;                                  // ~1.5 waves per second
          // The thumb tip rests ~5px from the hood outline, so the wave swings from
          // the rest pose outward and back (forearm 0..0.30 rad) and the trailing
          // hand is biased outward too: the thumb never sweeps into the hood.
          float fore = uWave * (0.15 + 0.15 * sin(ph));        // forearm swing about the elbow
          float hand = uWave * (0.06 + 0.11 * sin(ph - 0.9));  // hand trails the forearm
          vec2 p = rotateAround(sp, uWrist, hand * aSkin.y);
          p = rotateAround(p, uElbow, fore);
          sp = mix(sp, p, aSkin.x);
          sRot += (fore + hand * aSkin.y) * aSkin.x;
        }
        k = stagger(uReveal, aStage.z, 0.42);
      } else {
        float kind = aStageB.w;                     // 0 frame, 1 letter, 2 cursor
        k = stagger(uGreet, aStage.z, 0.22);
        sSize = aStageB.x * uScale;
        sColor = toneColor(aStage.w);
        sAlpha = kind > 0.5 && kind < 1.5 ? 0.42 : (kind > 1.5 ? 0.55 : 0.5);
        if (kind > 1.5 && uGreet > 0.95) sAlpha *= step(0.0, sin(t * 7.0)) * 0.85 + 0.15;
        if (kind > 0.5 && kind < 1.5) {
          sp.y += sin(t * 3.0 + aSeed.x * 9.0) * 0.5;
          sGlyph = k > 0.94 ? aStageB.z : randomGlyph(aSeed.x, 16.0);   // decode effect
        } else {
          sGlyph = randomGlyph(aSeed.x, 0.8);
        }
        sRot = (aSeed.z - 0.5) * 0.12;
      }

      pos = curve(o, sp, k, aSeed.w, aRole < 1.5 ? 0.55 : 0.3);
      size = mix(oSize, sSize, k);
      alpha = mix(oAlpha, sAlpha, k);
      color = mix(oColor, sColor, k);
      rot = mix(oRot, sRot, k);
      glyph = k > 0.6 ? sGlyph : oGlyph;
    }

    /* ---------------- dissolve: avatar + greeting blow away into the sea ---------------- */
    if (aRole > 0.5 && uDissolve > 0.0) {
      vec2 from = pos;
      // disintegration sweeps left -> right across the avatar + greeting group
      float sweep = clamp((from.x - (uFocusRect.x - uFocusRect.z)) / (2.0 * uFocusRect.z), 0.0, 1.0);
      float kd = stagger(uDissolve, sweep * 0.75 + aSeed.y * 0.25, 0.6);
      float gust = sin(kd * PI);
      vec2 wind = vec2(1.0, 0.25 + (aSeed.z - 0.5) * 0.9) * (120.0 + aSeed.w * 260.0) * uScale;
      vec2 swirl = vec2(sin(t * 3.0 + aSeed.x * 20.0), cos(t * 2.6 + aSeed.y * 17.0)) * 14.0;
      pos = curve(from, o, kd, aSeed.x, 0.6) + (wind + swirl) * gust;
      size = mix(size, oSize, kd) * (1.0 + gust * 0.15);
      alpha = mix(alpha, oAlpha, kd * kd) * (1.0 - gust * 0.2);   // dust stays visible, then settles
      color = mix(mix(color, oColor, kd), uSoft, gust * 0.3);
      rot = mix(rot, oRot, kd) + gust * (aSeed.w - 0.5) * 3.0;
      glyph = kd > 0.15 ? oGlyph : glyph;
    }

    /* ---------------- title: particles rise out of the sea into the hero heading ---------------- */
    if (aTitle.w > -0.5) {
      if (uHandoff < 0.999) {
        float kt = stagger(uTitle, aTitle.z, 0.4);
        vec2 from = pos;
        pos = curve(from, aTitle.xy, kt, aSeed.z, 0.7);
        pos += normalize(from + vec2(0.001)) * sin(kt * PI) * (40.0 + aSeed.y * 120.0) * uScale;
        float tAlpha = aTitle.w > 1.5 ? 0.4 : 0.52;
        size = mix(size, aTitleB.x, kt) * (1.0 - uHandoff * 0.35);
        alpha = mix(alpha, tAlpha, kt) * (1.0 - smoothstep(0.0, 0.85, uHandoff));
        color = mix(color, toneColor(aTitle.w), kt);
        rot = mix(rot, 0.0, kt);
        glyph = kt > 0.92 ? aTitleB.y : (kt > 0.05 ? randomGlyph(aSeed.y, 14.0) : glyph);
        if (glyph < 0.0) glyph = oGlyph;
      } else {
        // after the crossfade the particle quietly rejoins the sea
        pos = o; size = oSize; color = oColor; glyph = oGlyph; rot = oRot;
        alpha = oAlpha * smoothstep(0.0, 1.0, uCalm);
      }
    }

    /* ---------------- output ---------------- */
    float g = floor(max(glyph, 0.0) + 0.5);
    float row = floor((g + 0.5) / uCols);
    float col = g - row * uCols;               // integer-safe: avoids the mod() precision bug
    vAtlas = (vec2(col, row) + vec2(uv.x, 1.0 - uv.y)) / vec2(uCols, uRows);
    vColor = color;
    vAlpha = clamp(alpha, 0.0, 1.0);

    if (vAlpha < 0.004) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);  // cull invisible particles
      return;
    }

    float s = sin(rot), c = cos(rot);
    vec2 local = position.xy * size;
    vec2 rotated = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + rotated, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D uAtlas;
  varying vec2 vAtlas;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float a = texture2D(uAtlas, vAtlas).a * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

/* ------------------------------------------------------------------- engine */

export class CharacterRevealEngine {
  constructor({ canvas, statusElement, skipButton, ready = Promise.resolve(), boot = null, timeScale = 1, reducedMotion = false }) {
    this.canvas = canvas;
    this.statusElement = statusElement;
    this.skipButton = skipButton;
    this.readyPromise = ready;
    // request progress + the hard wait limit, from js/boot-requests.js
    this.boot = boot;
    this.sync = { readyAtMs: null, holdStartedMs: null, heldMs: 0, timedOut: false, hasHero: false, rewaves: 0 };
    this.timeScale = timeScale;
    this.reducedMotion = reducedMotion;

    this.clock = new THREE.Clock(false);
    this.time = 0;
    this.pointer = { x: 0, y: 0, active: false, strength: 0 };
    this.ripples = [];
    this.u = {
      oceanIn: 0, disturb: 0, reveal: 0, wave: 0, greet: 0, dissolve: 0, title: 0, handoff: 0, calm: 0,
      focus: 0, focusX: 0, focusY: 0, focusRX: 1, focusRY: 1,
    };
    this.isReady = false;
    this.waiting = false;
    this.hasCompleted = false;
    this.greetingLine = "Hi, I am Abhiraam S";
    this.quality = { bloom: true, pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5), downgraded: [] };
    this.frameTimes = [];
    this.lastFrame = 0;

    this.avatarGenerator = new AvatarMaskGenerator({ imageUrl: "/intro/avatar1.png" });
    this.textSampler = new TextTargetSampler();
    this.domSampler = new DomTextSampler();
  }

  async start() {
    await this.loadFonts();
    this.glyphAtlas = new GlyphAtlasTexture();
    this.createRenderer();
    await this.avatarGenerator.load();
    this.rebuild();
    this.createTimeline();
    this.bindEvents();
    // A failed request is NOT "ready": boot-requests retries, and the hard cap releases the hold.
    this.readyPromise.then(() => this.setReady(), () => {});
    document.body.classList.add("loaded");
    this.clock.start();
    if (this.reducedMotion) this.skip();
    this.renderer.setAnimationLoop((now) => this.frame(now));
  }

  async loadFonts() {
    const fonts = [ATLAS_FONT, "800 160px 'JetBrains Mono'", "400 16px 'Space Mono'", "400 16px 'Roboto Condensed'"];
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      await Promise.race([Promise.all(fonts.map((f) => document.fonts.load(f))).then(() => document.fonts.ready), timeout]);
    } catch {
      /* fall back to whatever is available */
    }
  }

  /* ---------------------------------------------------------- renderer */

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#050505");
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    this.camera.position.z = 5;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.32, 0.24);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAtlas: { value: this.glyphAtlas.texture },
        uCols: { value: this.glyphAtlas.columns },
        uRows: { value: this.glyphAtlas.rows },
        uGlyphCount: { value: this.glyphAtlas.count },
        uFreq: { value: this.padFrequent(this.glyphAtlas.frequentIndices) },
        uTime: { value: 0 },
        uViewport: { value: new THREE.Vector2(1, 1) },
        uScale: { value: 1 },
        uOceanIn: { value: 0 },
        uDisturb: { value: 0 },
        uReveal: { value: 0 },
        uWave: { value: 0 },
        uGreet: { value: 0 },
        uDissolve: { value: 0 },
        uTitle: { value: 0 },
        uHandoff: { value: 0 },
        uCalm: { value: 0 },
        uFocus: { value: 0 },
        uFocusRect: { value: new THREE.Vector4(0, 0, 1, 1) },
        uPointer: { value: new THREE.Vector3() },
        uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4()) },
        uElbow: { value: new THREE.Vector2() },
        uWrist: { value: new THREE.Vector2() },
        // palette = portfolio tailwind theme (colours are converted to linear by THREE.Color)
        uOceanLow: { value: new THREE.Color("#2a0833") },
        uAccent: { value: new THREE.Color("#ff00ff") },
        uSoft: { value: new THREE.Color("#ff9cff") },
        uWhite: { value: new THREE.Color("#ffffff") },
        uDim: { value: new THREE.Color("#888888") },
      },
    });
  }

  padFrequent(indices) {
    const out = new Array(11);
    for (let i = 0; i < 11; i++) out[i] = indices[i % indices.length];
    return out;
  }

  /* ---------------------------------------------------------- particle layout */

  rebuild() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.width = width;
    this.height = height;
    this.mobile = width < 768;
    this.lastLayout = { width, height };

    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    Object.assign(this.camera, { left: -width / 2, right: width / 2, top: height / 2, bottom: -height / 2 });
    this.camera.updateProjectionMatrix();

    const mobile = this.mobile;
    const counts = mobile
      ? { total: 26000, avatar: 7400, greeting: 2800, title: 7000 }
      : { total: 52000, avatar: 15000, greeting: 5200, title: 13000 };
    this.counts = counts;

    const layout = this.computeLayout(width, height, mobile);
    this.layout = layout;

    const avatarTargets = this.avatarGenerator.sample(counts.avatar, layout.avatar.width, layout.avatar.height);
    const greetingTargets = this.textSampler.sample(["Hi, I am", "Abhiraam S"], counts.greeting, {
      x: layout.greeting.x,
      y: layout.greeting.y,
      width: layout.greeting.width,
      height: layout.greeting.height,
      bodySize: mobile ? 28 : 38,
      lineHeight: mobile ? 40 : 54,
      align: "left",
      bubble: true,
    });
    this.avatarTargets = avatarTargets;
    this.greetingTargets = greetingTargets;

    const n = counts.total;
    const home = new Float32Array(n * 2);
    const seed = new Float32Array(n * 4);
    const role = new Float32Array(n);
    const stage = new Float32Array(n * 4);
    const stageB = new Float32Array(n * 4);
    const title = new Float32Array(n * 4).fill(0);
    const titleB = new Float32Array(n * 2);
    const skin = new Float32Array(n * 2);

    // ocean: jittered grid that overfills the viewport
    const spacing = Math.max(8, Math.sqrt((width * height) / n) * 0.94);
    const columns = Math.ceil(width / spacing) + 6;
    for (let i = 0; i < n; i++) {
      const c = i % columns;
      const r = Math.floor(i / columns);
      home[i * 2] = c * spacing - width / 2 - spacing * 3 + (Math.random() - 0.5) * spacing * 0.8;
      home[i * 2 + 1] = height / 2 - r * spacing + spacing * 3 + (Math.random() - 0.5) * spacing * 0.8;
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random();
      title[i * 4 + 3] = -1;
    }

    // random (not centre-first) casting, so the sea thins evenly instead of leaving a hole
    const order = this.shuffled(n);
    const stageIndices = [];
    for (let j = 0; j < counts.avatar; j++) {
      const i = order[j];
      const tg = avatarTargets[j];
      role[i] = ROLE_AVATAR;
      stage.set([tg.x + layout.avatar.x, tg.y + layout.avatar.y, tg.delay, tg.code], i * 4);
      stageB.set([tg.sizeBoost, tg.brightness, -1, tg.edge], i * 4);
      skin.set(tg.skin, i * 2);
      stageIndices.push(i);
    }
    for (let j = 0; j < counts.greeting; j++) {
      const i = order[counts.avatar + j];
      const tg = greetingTargets[j];
      const kind = tg.region === "textCharacters" ? 1 : tg.region === "textCursor" ? 2 : 0;
      const size = kind === 1 ? 3.6 + seed[i * 4 + 1] * 1.3 : kind === 2 ? 4.4 : 3.6 + seed[i * 4 + 1];
      role[i] = ROLE_GREETING;
      stage.set([tg.x, tg.y, tg.delay, tg.tone], i * 4);
      stageB.set([size, tg.brightness, tg.glyphIndex, kind], i * 4);
      stageIndices.push(i);
    }

    // the name is assembled from the avatar + greeting particles
    this.shuffleInPlace(stageIndices);
    this.titleMembers = stageIndices.slice(0, Math.min(counts.title, stageIndices.length));
    this.fillTitleTargets(title, titleB);

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    geometry.setAttribute("aHome", new THREE.InstancedBufferAttribute(home, 2));
    geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 4));
    geometry.setAttribute("aRole", new THREE.InstancedBufferAttribute(role, 1));
    geometry.setAttribute("aStage", new THREE.InstancedBufferAttribute(stage, 4));
    geometry.setAttribute("aStageB", new THREE.InstancedBufferAttribute(stageB, 4));
    geometry.setAttribute("aTitle", new THREE.InstancedBufferAttribute(title, 4));
    geometry.setAttribute("aTitleB", new THREE.InstancedBufferAttribute(titleB, 2));
    geometry.setAttribute("aSkin", new THREE.InstancedBufferAttribute(skin, 2));
    geometry.instanceCount = this.quality.reducedCount ? Math.floor(n * 0.65) : n;
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    const uni = this.material.uniforms;
    uni.uViewport.value.set(width, height);
    uni.uScale.value = mobile ? 0.82 : 1;
    const joint = ({ u, v }) => [layout.avatar.x + (u - 0.5) * layout.avatar.width, layout.avatar.y - (v - 0.5) * layout.avatar.height];
    uni.uElbow.value.set(...joint(ARM_RIG.elbow));
    uni.uWrist.value.set(...joint(ARM_RIG.wrist));

    // focus rects: avatar+bubble group first, then the hero heading
    this.focusStage = layout.focus;
    if (this.u.title < 0.5) Object.assign(this.u, { focusX: this.focusStage.x, focusY: this.focusStage.y, focusRX: this.focusStage.rx, focusRY: this.focusStage.ry });
    else Object.assign(this.u, { focusX: this.focusTitle.x, focusY: this.focusTitle.y, focusRX: this.focusTitle.rx, focusRY: this.focusTitle.ry });
  }

  /**
   * Measures the live hero heading ([data-particle] elements) and writes the
   * name targets for the title particles. In the React app the hero only exists
   * once the profile has loaded, so this runs again when the app reports ready
   * and right before the title phase. Without a hero, the title particles simply
   * stay in the sea and the page's own loading/error state is shown at handoff.
   */
  fillTitleTargets(title, titleB) {
    const elements = [...document.querySelectorAll("[data-particle]")];
    const members = this.titleMembers;
    const targets = elements.length ? this.domSampler.sample(elements, members.length, { width: this.width, height: this.height }) : [];
    const hasHero = elements.length > 0 && (this.domSampler.stats?.characters || 0) > 0;
    for (let j = 0; j < members.length; j++) {
      const i = members[j];
      if (hasHero) {
        const tg = targets[j];
        title.set([tg.x, tg.y, tg.delay, tg.tone], i * 4);
        titleB.set([tg.size, tg.glyphIndex], i * 2);
      } else {
        title[i * 4 + 3] = -1;
      }
    }
    this.titleTargets = hasHero ? targets : [];
    this.sync.hasHero = hasHero;

    const b = hasHero ? this.domSampler.stats.bounds : null;
    this.focusTitle = b
      ? { x: (b.minX + b.maxX) / 2 - this.width / 2, y: this.height / 2 - (b.minY + b.maxY) / 2, rx: (b.maxX - b.minX) * 0.62, ry: (b.maxY - b.minY) * 0.75 + 40 }
      : this.layout.focus;
    return hasHero;
  }

  /** Re-measure the hero (only safe before the title particles start moving). */
  refreshTitleTargets() {
    if (!this.mesh || this.u.title > 0.001) return false;
    const attrs = this.mesh.geometry.attributes;
    const hasHero = this.fillTitleTargets(attrs.aTitle.array, attrs.aTitleB.array);
    attrs.aTitle.needsUpdate = true;
    attrs.aTitleB.needsUpdate = true;
    return hasHero;
  }

  computeLayout(width, height, mobile) {
    if (mobile) {
      const aw = Math.min(width * 0.92, height * 0.5);
      const ah = aw * (430 / 520);
      const avatar = { x: 0, y: height * 0.12, width: aw, height: ah };
      const gw = Math.min(width - 40, 360);
      const greeting = { x: 0, y: avatar.y - ah * 0.5 - 110, width: gw, height: 150 };
      return { avatar, greeting, focus: { x: 0, y: avatar.y - 60, rx: width * 0.6, ry: ah * 0.9 + 80 } };
    }
    const aw = Math.min(width * 0.44, height * 0.78);
    const ah = aw * (430 / 520);
    const gw = Math.min(width * 0.28, 400);
    const gh = Math.min(200, gw * 0.52);
    const gap = Math.max(24, aw * 0.06);
    // avatar spans roughly [-0.46, +0.48] of its width; the bubble sits right of it
    const groupLeft = -aw * 0.46;
    const groupRight = aw * 0.48 + gap + gw;
    const shift = -(groupLeft + groupRight) / 2;
    const avatar = { x: shift, y: -height * 0.02, width: aw, height: ah };
    const greeting = { x: shift + aw * 0.48 + gap + gw / 2, y: avatar.y + ah * 0.14, width: gw, height: gh };
    return {
      avatar,
      greeting,
      focus: { x: 0, y: avatar.y, rx: (groupRight - groupLeft) * 0.6, ry: ah * 0.7 },
    };
  }

  shuffled(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    return this.shuffleInPlace(a);
  }

  shuffleInPlace(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------------------------------------------------------- timeline */

  createTimeline() {
    const u = this.u;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    this.timeline = tl;

    tl.call(() => this.setStatus("BOOTING_SEQUENCE"), null, 0)
      .call(() => document.body.classList.add("can-skip"), null, 1.5)
      // 0-8 ocean: boots outward from the centre, then rolls
      .to(u, { oceanIn: 1, duration: 3.2, ease: "power2.out" }, T.oceanIn)
      .call(() => this.setStatus("SYNCING_SIGNAL"), null, 4)
      // 8-11 vortex, released while the avatar gathers
      .call(() => this.setStatus("CALIBRATING_VORTEX"), null, T.disturb)
      .to(u, { disturb: 1, duration: 1.6, ease: "sine.inOut" }, T.disturb)
      .to(u, { disturb: 0, duration: 2.6, ease: "sine.inOut" }, T.reveal + 0.2)
      // 11-17 avatar forms
      .call(() => this.setStatus("SCANNING_IDENTITY"), null, T.reveal)
      .to(u, { reveal: 1, duration: 6, ease: "power1.inOut" }, T.reveal)
      .to(u, { focus: 1, duration: 3, ease: "sine.inOut" }, T.reveal + 0.3)
      // 18-22 arm-only wave
      .call(() => this.setStatus("HANDSHAKE"), null, T.wave)
      .to(u, { wave: 1, duration: 0.5, ease: "power2.out" }, T.wave)
      .to(u, { wave: 0, duration: 0.9, ease: "sine.inOut" }, T.wave + 3.1)
      // 22-29 greeting decodes, then stays readable
      .call(() => this.setStatus("ESTABLISHING_UPLINK"), null, T.greet)
      .call(() => this.speakGreeting(), null, T.greet + 0.3)
      .to(u, { greet: 1, duration: 4.5, ease: "power1.inOut" }, T.greet)
      .call(() => this.holdIfNotReady(), null, T.hold)
      // 29-35 dissolve: blown left -> right back into the sea
      .call(() => this.setStatus("DEFRAGMENTING"), null, T.dissolve)
      .to(u, { dissolve: 1, duration: 6.4, ease: "sine.inOut" }, T.dissolve)
      // the sea flows back into the centre while the dust settles...
      .to(u, { focus: 0.25, duration: 3.5, ease: "sine.inOut" }, T.dissolve + 1.5)
      // ...and dims again around the name as it rises
      .to(u, { focus: 1, duration: 2.5, ease: "sine.inOut" }, T.title)
      .to(u, { focusX: () => this.focusTitle.x, focusY: () => this.focusTitle.y, focusRX: () => this.focusTitle.rx, focusRY: () => this.focusTitle.ry, duration: 2.0, ease: "sine.inOut" }, T.dissolve + 6.4)
      // 35-41 the name rises out of the sea and holds (re-measure the hero first)
      .call(() => this.refreshTitleTargets(), null, T.title - 0.4)
      .call(() => this.setStatus("COMPILING_INTERFACE"), null, T.title)
      .to(u, { title: 1, duration: 4.4, ease: "power1.inOut" }, T.title)
      .call(() => this.beginHandoff(), null, T.handoff)
      .to(u, { handoff: 1, duration: 1.1, ease: "sine.inOut" }, T.handoff)
      .to(u, { calm: 1, duration: 1.8, ease: "sine.inOut" }, T.calm)
      .to(u, { focus: 0, duration: 1.8, ease: "sine.inOut" }, T.calm)
      .call(() => this.completeIntro(), null, T.calm + 0.2);

    tl.timeScale(this.timeScale);
  }

  /* ---------------------------------------------------------- loading sync */

  /**
   * Called when the portfolio data is in AND the hero is rendered (standalone:
   * when the profile request resolves; React: from the Dashboard after render).
   */
  setReady() {
    if (this.isReady) return;
    this.isReady = true;
    this.sync.readyAtMs = Math.round(this.elapsedMs());
    this.refreshTitleTargets();   // the hero may only exist now
    if (this.waiting) this.releaseHold();
  }

  elapsedMs() {
    return this.boot ? this.boot.elapsed() : performance.now();
  }

  /** At the end of the greeting: continue if ready, otherwise hold in a living loop. */
  holdIfNotReady() {
    if (this.isReady || this.hasCompleted) return;
    const capMs = this.boot?.capMs ?? 60000;
    const remaining = capMs - this.elapsedMs();
    if (remaining <= 0) {
      this.sync.timedOut = true;
      return;
    }
    this.waiting = true;
    this.sync.holdStartedMs = Math.round(this.elapsedMs());
    this.timeline.pause();

    // keep the scene alive: the avatar waves again every ~6.5 s while we wait
    this.holdLoop = gsap.timeline({ repeat: -1, delay: 1.2, onRepeat: () => this.sync.rewaves++ })
      .to(this.u, { wave: 1, duration: 0.5, ease: "power2.out" })
      .to(this.u, { wave: 0, duration: 0.9, ease: "sine.inOut" }, "+=2.6")
      .to({}, { duration: 2.5 });

    // live, per-request status in the boot line
    const render = () => this.setStatus(this.formatSyncStatus());
    render();
    this.statusTimer = setInterval(render, 250);
    this.unsubscribeBoot = this.boot?.onChange(render);

    // hard limit: never trap the visitor
    this.capTimer = setTimeout(() => {
      this.sync.timedOut = true;
      this.refreshTitleTargets();
      this.releaseHold();
    }, remaining);
  }

  releaseHold() {
    if (!this.waiting) return;
    this.waiting = false;
    this.sync.heldMs = Math.round(this.elapsedMs() - (this.sync.holdStartedMs ?? this.elapsedMs()));
    this.stopHoldLoop();
    // let a wave in progress settle, then carry on with the dissolve
    gsap.to(this.u, {
      wave: 0,
      duration: this.u.wave > 0.01 ? 0.6 : 0.01,
      ease: "sine.inOut",
      onComplete: () => this.timeline.play(),
    });
  }

  stopHoldLoop() {
    this.holdLoop?.kill();
    this.holdLoop = null;
    clearInterval(this.statusTimer);
    clearTimeout(this.capTimer);
    this.unsubscribeBoot?.();
    this.unsubscribeBoot = null;
  }

  /** e.g. "AWAITING_DATA · PROFILE 14S · STATS OK · REPOS 14S" */
  formatSyncStatus() {
    const state = this.boot?.state;
    if (!state) return "AWAITING_DATA_STREAM";
    const secs = Math.floor(this.elapsedMs() / 1000);
    const label = { profile: "PROFILE", stats: "STATS", github: "REPOS" };
    const parts = Object.keys(label).map((key) => {
      const s = state[key];
      if (!s) return null;
      if (s.status === "done") return `${label[key]} OK`;
      if (s.status === "failed") return `${label[key]} ERR`;
      if (s.status === "retrying") return `${label[key]} RETRY`;
      return `${label[key]} ${secs}S`;
    }).filter(Boolean);
    return ["AWAITING_DATA", ...parts].join(" · ");
  }

  setStatus(text) {
    if (this.statusElement) this.statusElement.textContent = text;
  }

  beginHandoff() {
    this.setStatus("SYSTEM_BOOT_COMPLETE");
    document.body.classList.add("handoff");
    this.typeBootLine();
  }

  typeBootLine() {
    const el = document.querySelector("[data-typewriter]");
    if (!el || el.dataset.typed) return;
    const full = el.dataset.full || el.textContent;
    el.dataset.full = full;
    el.dataset.typed = "1";
    if (this.reducedMotion) {
      el.textContent = full;
      return;
    }
    let i = 0;
    el.textContent = "";
    const step = () => {
      i = Math.min(full.length, i + 2);
      el.textContent = full.slice(0, i);
      if (i < full.length) setTimeout(step, 22);
    };
    step();
  }

  completeIntro() {
    if (this.hasCompleted) return;
    this.hasCompleted = true;
    document.body.classList.add("handoff", "intro-complete");
    document.body.classList.remove("intro-running", "can-skip");
    try {
      localStorage.setItem("introSeen", "1");
    } catch {
      /* storage unavailable */
    }
  }

  skip() {
    if (this.hasCompleted) return;
    this.waiting = false;
    this.stopHoldLoop();
    this.timeline.progress(1, true).pause();
    Object.assign(this.u, {
      oceanIn: 1, disturb: 0, reveal: 1, wave: 0, greet: 1, dissolve: 1, title: 1, handoff: 1, calm: 1, focus: 0,
    });
    this.beginHandoff();
    this.completeIntro();
  }

  speakGreeting() {
    // Browsers block speech without a prior user gesture; don't try in that case.
    if (!("speechSynthesis" in window) || !navigator.userActivation?.hasBeenActive || this.reducedMotion) return;
    const utterance = new SpeechSynthesisUtterance(this.greetingLine);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => /^en/i.test(v.lang) && /(natural|neural|online|google|jenny|aria)/i.test(v.name))
      || voices.find((v) => /^en/i.test(v.lang));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  /* ---------------------------------------------------------- input */

  bindEvents() {
    let resizeTimer = 0;
    this.onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // ignore mobile URL-bar height jitter
        if (w === this.lastLayout.width && Math.abs(h - this.lastLayout.height) < 140) return;
        this.rebuild();
      }, 180);
    };
    this.onPointerMove = (event) => {
      this.updatePointer(event);
      this.pointer.active = true;
    };
    this.onPointerLeave = () => {
      this.pointer.active = false;
    };
    this.onPointerDown = (event) => {
      if (event.target.closest?.("a, button")) return;
      this.updatePointer(event);
      this.ripples.push({ x: this.pointer.x, y: this.pointer.y, t0: this.time, strength: 1.3 });
      if (this.ripples.length > MAX_RIPPLES) this.ripples.shift();
    };
    this.onKeyDown = (event) => {
      if (event.key === "Escape" && !this.hasCompleted) this.skip();
    };

    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("keydown", this.onKeyDown);
    this.skipButton?.addEventListener("click", () => this.skip());
  }

  updatePointer(event) {
    this.pointer.x = event.clientX - this.width / 2;
    this.pointer.y = this.height / 2 - event.clientY;
  }

  /* ---------------------------------------------------------- frame */

  frame(now) {
    const dt = this.clock.getDelta();
    if (!this.reducedMotion) this.time += Math.min(dt, 0.05);
    if (this.debugTime != null) this.time = this.debugTime; // test hook: freeze shader time

    // after the intro, run the background at ~30 fps
    if (this.hasCompleted && now - this.lastFrame < 31) return;
    this.trackPerformance(now);
    this.lastFrame = now;

    this.pointer.strength += ((this.pointer.active ? 0.75 : 0) - this.pointer.strength) * 0.06;

    const uni = this.material.uniforms;
    const u = this.u;
    uni.uTime.value = this.time;
    uni.uOceanIn.value = u.oceanIn;
    uni.uDisturb.value = u.disturb;
    uni.uReveal.value = u.reveal;
    uni.uWave.value = u.wave;
    uni.uGreet.value = u.greet;
    uni.uDissolve.value = u.dissolve;
    uni.uTitle.value = u.title;
    uni.uHandoff.value = u.handoff;
    uni.uCalm.value = u.calm;
    uni.uFocus.value = u.focus;
    uni.uFocusRect.value.set(u.focusX, u.focusY, u.focusRX, u.focusRY);
    uni.uPointer.value.set(this.pointer.x, this.pointer.y, this.pointer.strength);
    // dense white heading blooms into a grey haze, so ease the glow off while it is up
    this.bloomPass.strength = 0.45 - 0.34 * Math.min(1, u.title * 3) * (1 - u.calm);
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const r = this.ripples[i];
      if (r) uni.uRipples.value[i].set(r.x, r.y, r.t0, r.strength);
      else uni.uRipples.value[i].set(0, 0, 0, 0);
    }

    this.composer.render();
  }

  /** Drop bloom / resolution / density if this device can't hold ~40 fps. */
  trackPerformance(now) {
    if (!this.lastFrame || this.hasCompleted) return;
    this.frameTimes.push(now - this.lastFrame);
    if (this.frameTimes.length < 90) return;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this.frameTimes.length = 0;
    if (median <= 25) return;
    if (this.bloomPass.enabled) {
      this.bloomPass.enabled = false;
      this.quality.bloom = false;
      this.quality.downgraded.push("bloom");
    } else if (this.quality.pixelRatio > 1) {
      this.quality.pixelRatio = 1;
      this.renderer.setPixelRatio(1);
      this.composer.setPixelRatio(1);
      this.quality.downgraded.push("pixelRatio");
    } else if (!this.quality.reducedCount) {
      this.quality.reducedCount = true;
      this.mesh.geometry.instanceCount = Math.floor(this.counts.total * 0.65);
      this.quality.downgraded.push("density");
    }
  }

  /* ---------------------------------------------------------- debug / tests */

  diagnostics() {
    const tally = (list, key) => list.reduce((acc, t) => ((acc[t[key]] = (acc[t[key]] || 0) + 1), acc), {});
    return {
      counts: this.counts,
      quality: this.quality,
      layout: this.layout,
      avatarRegionCounts: tally(this.avatarTargets, "region"),
      greetingRegionCounts: tally(this.greetingTargets, "region"),
      titleToneCounts: tally(this.titleTargets, "tone"),
      titleSampler: this.domSampler.stats,
      sync: {
        ...this.sync,
        isReady: this.isReady,
        waiting: this.waiting,
        requests: this.boot ? JSON.parse(JSON.stringify(this.boot.state)) : null,
        capMs: this.boot?.capMs ?? null,
      },
      maskStats: this.avatarGenerator.stats,
      timelineDuration: this.timeline.duration(),
      state: Object.fromEntries(Object.entries(this.u).filter(([, v]) => typeof v === "number")),
    };
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("keydown", this.onKeyDown);
    this.timeline.kill();
    this.glyphAtlas.dispose();
    this.mesh?.geometry.dispose();
    this.material.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
