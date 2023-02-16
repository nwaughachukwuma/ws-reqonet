import { defineConfig } from "tsup";

export default defineConfig({
  sourcemap: true,
  clean: true,
  minify: true,
  entry: ["index.ts"],
  format: ["esm", "cjs"],
  outDir: "lib",
  target: "node14",
});
