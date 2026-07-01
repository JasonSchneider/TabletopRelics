import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // Injected at build time from Vercel's system env vars.
    // Falls back to 'dev' locally so footer degrades gracefully.
    __GIT_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? "dev"),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "Tabletop Relics",
        short_name: "Relics",
        description:
          "Control your Arduino-powered tabletop props — Magic Compass, Haunted Lantern, and Fairy Stones.",
        theme_color: "#1a0f2e",
        background_color: "#0a0612",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    host: true, // expose on LAN so phones can connect during dev
    port: 5173,
    // Allow ngrok / cloudflared tunnels through Vite's host check.
    // Leading dot = match any subdomain (URLs change each ngrok session).
    allowedHosts: [".ngrok-free.app", ".ngrok.io", ".ngrok.app", ".trycloudflare.com"],
  },
});
