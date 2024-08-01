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
    // env: {
    //   DATABASE_URL: `${BASE_DATABASE_PATH}`,
    //   qert: "qwert",
    // },
    coverage: {
      include: ["**/*.{ts,tsx}"],
      all: true,
    },
  },
})
