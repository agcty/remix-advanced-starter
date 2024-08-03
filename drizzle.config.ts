import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./db/out",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
