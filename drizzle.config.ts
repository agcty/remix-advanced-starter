import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./schema/*",
  out: "./db/out",
  dialect: "sqlite",
  dbCredentials: {
    url: "sqlite.db",
  },
})
