import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
      extend: {
          colors: {
              "accent": "#FF00FF", // Striking Magenta
              "background": "#050505",
              "surface": "#0F0F0F",
              "surface-accent": "#1A1A1A",
              "text-dim": "#888888",
              "text-main": "#FFFFFF"
          },
          fontFamily: {
              "header": ["JetBrains Mono", "monospace"],
              "technical": ["Roboto Condensed", "sans-serif"],
              "mono": ["Space Mono", "monospace"]
          },
          // Fluid type: each size scales smoothly with the viewport between a phone
          // minimum and a desktop maximum (rem parts keep browser zoom working).
          fontSize: {
              "label": ["clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)", { lineHeight: "1.45" }],       // 11 → 12px
              "chip": ["clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)", { lineHeight: "1.5" }],         // 12 → 13px
              "body-sm": ["clamp(0.8125rem, 0.77rem + 0.2vw, 0.9375rem)", { lineHeight: "1.65" }],    // 13 → 15px
              "body-lg": ["clamp(0.9375rem, 0.85rem + 0.4vw, 1.125rem)", { lineHeight: "1.7" }],      // 15 → 18px
              "card-title": ["clamp(1.125rem, 1rem + 0.55vw, 1.5rem)", { lineHeight: "1.15" }],       // 18 → 24px
              "section": ["clamp(1.75rem, 0.9rem + 3.6vw, 4rem)", { lineHeight: "1" }],               // 28 → 64px
              "hero-sub": ["clamp(1.375rem, 0.9rem + 2.1vw, 3rem)", { lineHeight: "1.05" }],          // 22 → 48px
              "hero": ["clamp(3.25rem, 0.75rem + 9.6vw, 10rem)", { lineHeight: "0.8" }],              // 52 → 160px
          },
          spacing: {
              "section": "clamp(4.5rem, 2.5rem + 6vw, 8rem)", // gap between page sections
          },
      }
  },
  plugins: [
    typography,
  ],
}
