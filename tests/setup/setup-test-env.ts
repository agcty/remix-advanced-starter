import { connection } from "db.server"
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest"
import { cleanup, seed } from "../../other/seed"
import { teardown } from "./global-setup"

beforeAll(async () => {})

beforeEach(async () => {
  await seed()
})

afterEach(async () => {
  await cleanup()
})

afterAll(async () => {
  connection.close()
})
