import { vitePlugin as remix } from "@remix-run/dev"
import { remixDevTools } from "remix-development-tools/vite"
import { flatRoutes } from "remix-flat-routes"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    remixDevTools(),
    remix({
      ignoredRouteFiles: ["**/*"],
      serverModuleFormat: "esm",
      routes: async defineRoutes => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: ["**/*.test.{js,jsx,ts,tsx}", "**/__*.*"],
        })
      },
    }),
    tsconfigPaths(),
  ],
})
