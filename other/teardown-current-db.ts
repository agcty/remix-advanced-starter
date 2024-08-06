import "dotenv/config"
import { connection } from "db.server"
import { teardown } from "./seed"

await teardown()

connection.end()
