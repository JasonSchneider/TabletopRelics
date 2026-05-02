/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tabletop Relics brand palette — moody, mystical, parchment.
        relic: {
          ink: "#0a0612",
          shadow: "#1a0f2e",
          dusk: "#2d1b4e",
          glow: "#a78bfa",
          ember: "#f59e0b",
          parchment: "#f4ecd8",
          rune: "#d4af37",
        },
      },
      fontFamily: {
        display: ['"Cinzel"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(167, 139, 250, 0.45)",
        ember: "0 0 32px rgba(245, 158, 11, 0.55)",
      },
    },
  },
  plugins: [],
};
