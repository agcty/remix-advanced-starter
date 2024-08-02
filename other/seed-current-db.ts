import "dotenv/config"
import { seed, teardown } from "./seed"

await seed()
await teardown()
