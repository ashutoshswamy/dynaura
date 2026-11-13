import { defineConfig } from "vite";

// Local playground: serves demo/ and exposes assets/ at the site root (logo, favicon).
export default defineConfig({
  root: "demo",
  publicDir: "../assets",
  esbuild: { jsx: "automatic" },
});
