import "./intro.css";
import { CharacterRevealEngine } from "./CharacterRevealEngine.js";

const params = new URLSearchParams(location.search);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !params.has("motion");

/*
 * Loading sync.
 * js/boot-requests.js already started the API calls at second 0 (window.__portfolioBoot).
 * "Ready" = the profile is loaded AND the hero is rendered, because the particles land on it.
 *   - Standalone (this folder): the hero mirror is static, so ready = profile request done.
 *   - React app: set `window.__INTRO_EXTERNAL_READY__ = true` and call
 *     `window.__intro.setReady()` once the Dashboard has rendered the hero.
 * GitHub repos / coding stats are NOT waited for: they fill in on the page afterwards.
 * The intro holds on the greeting (alive, with live request status) until ready, and
 * never longer than boot.capMs (60 s from page start).
 */
const boot = window.__portfolioBoot || null;
const ready = window.__INTRO_EXTERNAL_READY__
  ? new Promise(() => {})                    // React calls window.__intro.setReady()
  : boot
    ? boot.requests.profile
    : Promise.resolve();

// Always the full, agreed timeline (it doubles as loading cover); ?speed=N is for testing only.
const timeScale = Number(params.get("speed")) || 1;

const engine = new CharacterRevealEngine({
  canvas: document.getElementById("ocean"),
  statusElement: document.getElementById("bootStatusText"),
  skipButton: document.getElementById("skipIntro"),
  ready,
  boot,
  timeScale,
  reducedMotion,
});

engine.start().catch((error) => {
  console.error(error);
  // never trap the visitor behind a broken intro
  document.body.classList.add("handoff", "intro-complete");
  document.body.classList.remove("intro-running");
  document.querySelectorAll("[data-typewriter]").forEach((el) => (el.textContent = el.dataset.full || el.textContent));
});

window.__intro = {
  engine,
  setReady: () => engine.setReady(),
  setStatus: (text) => engine.setStatus(text),
};
// kept for the existing Playwright scripts
window.__characterRevealEngine = engine;
