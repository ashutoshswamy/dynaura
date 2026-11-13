import { defineConfig } from "tsup";
export default defineConfig({
  entry: { index: "src/index.tsx", vanilla: "src/vanilla.ts", vue: "src/vue.ts", svelte: "src/svelte.ts" },
  target: "es2019",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "vue"],
  banner: { js: '"use client";' },
  onSuccess: "cp src/styles.css dist/styles.css",
});
