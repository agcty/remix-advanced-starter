import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "schema/postgres"

// export const connection = new Client({
//   connectionString: process.env.DATABASE_URL,
// })

export const connection = postgres(process.env.DATABASE_URL)

// export const connection = new Pool({
//   connectionString: process.env.DATABASE_URL,
// })

export const db = drizzle(connection, { schema })
