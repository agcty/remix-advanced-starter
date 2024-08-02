import { connection } from "db.server"
import { afterAll, afterEach, beforeEach } from "vitest"
import { seed, teardown } from "../../other/seed"

beforeEach(async () => {
  await seed()
})

afterEach(async () => {
  await teardown()
})

afterAll(async () => {
  connection.close()
})
