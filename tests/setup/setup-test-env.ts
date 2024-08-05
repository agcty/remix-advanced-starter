import { connection } from "db.server"
import { seed, teardown } from "other/seed"
import { afterAll, afterEach, beforeEach } from "vitest"

beforeEach(async () => {
  await seed()
})

afterEach(async () => {
  await teardown()
})

afterAll(async () => {
  connection.end()
})
