import type Database from "better-sqlite3"
import { type db } from "db.server"
import { type ExtractTablesWithRelations } from "drizzle-orm"
import {
  type BaseSQLiteDatabase,
  type SQLiteTransaction,
} from "drizzle-orm/sqlite-core"
import type * as schema from "schema"

type Database = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]

export type TransactionParam = {
  tx?: Database
}
