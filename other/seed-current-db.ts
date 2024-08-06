import "dotenv/config"
import { connection } from "db.server"
import { seed } from "./seed"

await seed()

connection.end()
