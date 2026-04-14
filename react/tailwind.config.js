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
          }
      }
  },
  plugins: [
    typography,
  ],
}
