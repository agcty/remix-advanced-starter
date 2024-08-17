import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./schema/postgres/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
