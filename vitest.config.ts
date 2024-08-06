/// <reference types="vitest" />

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  css: { postcss: { plugins: [] } },
  test: {
    include: ["**/*.test.{ts,tsx}"],
    globalSetup: ["./tests/setup/global-setup.ts"],
    setupFiles: ["./tests/setup/setup-test-env.ts"],
    restoreMocks: true,
    // As we are using SQLite in-memory database, we need to run tests sequentially to avoid conflicts with setup and teardown
    fileParallelism: false,
    coverage: {
      include: ["**/*.{ts,tsx}"],
      all: true,
    },
  },
})
