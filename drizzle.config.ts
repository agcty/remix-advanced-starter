import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./schema/postgres/index.ts",
  out: "./db/out",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
