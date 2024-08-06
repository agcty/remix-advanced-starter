import path from "node:path"
import { connection } from "db.server"
import { config } from "dotenv"
import { afterAll, afterEach, beforeEach } from "vitest"

config({ path: path.join(process.cwd(), ".env.test") })

beforeEach(async () => {
  const { seed } = await import("other/seed")
  await seed()
})

afterEach(async () => {
  const { teardown } = await import("other/seed")
  await teardown()
})

afterAll(async () => {
  connection.end()
})
