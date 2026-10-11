import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths so the build works under any GitHub Pages subpath.
  base: "./",
  plugins: [react()],
  test: { include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.ts"] },
});
