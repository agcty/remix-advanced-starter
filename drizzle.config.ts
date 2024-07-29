import { defineConfig } from "drizzle-kit"

let isProd = process.env.NODE_ENV === "production"

isProd = true

export default defineConfig({
  schema: "./schema/*",
  out: "./db/out",
  dialect: "sqlite",
  dbCredentials: {
    url: isProd ? "sqlite.db" : "sqlite.db",
  },
})
