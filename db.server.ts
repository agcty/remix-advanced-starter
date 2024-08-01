import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema/multitenancy"

// TODO: Replace with your own database connection for production
export const connection = new Database("sqlite.db")
export const db = drizzle(connection, { schema })
