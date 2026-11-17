import { defineConfig } from "vitest/config";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  // solid-js resolves to its server build (onMount / effects are no-ops) unless the browser condition is on
  resolve: { conditions: ["browser", "development"] },
  test: { environment: "jsdom", setupFiles: ["test/setup.ts"], server: { deps: { inline: [/solid-js/] } } },
});
