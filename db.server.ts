import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { drizzle as localDrizzle } from "drizzle-orm/node-postgres"
import { Client } from "pg"
import * as schema from "schema/postgres"

export const connection = new Database(process.env.DATABASE_URL)
export const db = drizzle(connection, { schema })

const client = new Client({
  connectionString: "postgres://testuser:testpass@127.0.0.1:5432/testdb",
})

export const localDb = localDrizzle(client, { schema })
