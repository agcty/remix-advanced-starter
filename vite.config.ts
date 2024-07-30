import { vitePlugin as remix } from "@remix-run/dev"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { glob } from "glob"
import { remixDevTools } from "remix-development-tools"
import { flatRoutes } from "remix-flat-routes"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const MODE = process.env.NODE_ENV

export default defineConfig({
  build: {
    cssMinify: MODE === "production",
    rollupOptions: {
      external: [/node:.*/, "stream", "crypto", "fsevents"],
    },
    assetsInlineLimit: (source: string) => {
      if (source.endsWith("sprite.svg")) {
        return false
      }
    },
    sourcemap: true,
  },
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
    process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          debug: true,
          silent: false,
          disable: MODE !== "production",
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          release: {
            name: process.env.COMMIT_SHA,
            setCommits: {
              auto: true,
            },
          },
          telemetry: true,
          sourcemaps: {
            filesToDeleteAfterUpload: await glob([
              "./build/**/*.map",
              ".server-build/**/*.map",
            ]),
          },
        })
      : null,
  ],
})
