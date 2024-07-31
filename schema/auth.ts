import { sql } from "drizzle-orm"
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"
import { createInsertSchema } from "drizzle-zod"
import { users } from "./multitenancy"

export const passwords = sqliteTable("auth_passwords", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  hash: text("hash").notNull(),
})

export const sessions = sqliteTable("auth_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expirationDate: integer("expiration_date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
})

export const verifications = sqliteTable(
  "auth_verifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    type: text("type").notNull(),
    target: text("target").notNull(),
    secret: text("secret").notNull(),
    algorithm: text("algorithm").notNull(),
    digits: integer("digits").notNull(),
    period: integer("period").notNull(),
    charSet: text("char_set").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
  },
  table => ({
    unq: unique().on(table.target, table.type),
  }),
)

export const connections = sqliteTable(
  "auth_connections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    providerName: text("provider_name").notNull(),
    providerId: text("provider_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  },
  table => ({
    unq: unique().on(table.providerName, table.providerId),
  }),
)

export const insertPasswordSchema = createInsertSchema(passwords)

export const insertSessionSchema = createInsertSchema(sessions)

export const insertVerificationSchema = createInsertSchema(verifications)

export const insertConnectionSchema = createInsertSchema(connections)
