import { connection } from "db.server"
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest"
import { seed, teardown } from "../../other/seed"

beforeAll(async () => {})

beforeEach(async () => {
  await seed()
})

afterEach(async () => {
  await teardown()
})

afterAll(async () => {
  connection.close()
})
