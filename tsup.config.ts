import { defineConfig } from "tsup";
export default defineConfig({
  entry: { index: "src/index.tsx", vanilla: "src/vanilla.ts", vue: "src/vue.ts", svelte: "src/svelte.ts", solid: "src/solid.ts", angular: "src/angular.ts" },
  target: "es2019",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "vue", "solid-js", "@angular/core"],
  banner: { js: '"use client";' },
  onSuccess: "cp src/styles.css dist/styles.css && sed '/^@import/d' src/styles.css > dist/styles-no-font.css",
});
