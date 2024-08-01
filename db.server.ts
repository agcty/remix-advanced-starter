import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema/multitenancy"

export const connection = new Database(process.env.DATABASE_URL)
export const db = drizzle(connection, { schema })
