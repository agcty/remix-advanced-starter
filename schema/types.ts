import type Database from "better-sqlite3"
import { type ExtractTablesWithRelations } from "drizzle-orm"
import {
  type BaseSQLiteDatabase,
  type SQLiteTransaction,
} from "drizzle-orm/sqlite-core"
import type * as schema from "schema"

export type TransactionParam = {
  tx?:
    | SQLiteTransaction<
        "sync",
        Database.RunResult,
        typeof schema,
        ExtractTablesWithRelations<typeof schema>
      >
    | BaseSQLiteDatabase<
        "sync",
        Database.RunResult,
        typeof schema,
        ExtractTablesWithRelations<typeof schema>
      >
}
