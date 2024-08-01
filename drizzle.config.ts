import { defineConfig } from "drizzle-kit"

console.log("DATABASE_URL2:", process.env.DATABASE_URL)

export default defineConfig({
  schema: "./schema/*",
  out: "./db/out",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
