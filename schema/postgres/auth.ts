import { sql } from "drizzle-orm"
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { users } from "./multitenancy"

export const passwords = pgTable("auth_passwords", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  hash: text("hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const sessions = pgTable(
  "auth_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    expirationDate: timestamp("expiration_date").notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    userIdIdx: index("user_sessions_id_idx").on(table.userId),
  }),
)

export const verifications = pgTable(
  "auth_verifications",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    type: text("type").notNull(),
    target: text("target").notNull(),
    secret: text("secret").notNull(),
    algorithm: text("algorithm").notNull(),
    digits: integer("digits").notNull(),
    period: integer("period").notNull(),
    charSet: text("char_set").notNull(),
    expiresAt: timestamp("expires_at"),
  },
  table => ({
    unq: unique().on(table.target, table.type),
    targetIdx: index("target_idx").on(table.target),
  }),
)

export const connections = pgTable(
  "auth_connections",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    providerName: text("provider_name").notNull(),
    providerId: text("provider_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  table => ({
    unq: unique().on(table.providerName, table.providerId),
    userIdIdx: index("user_id_idx").on(table.userId),
  }),
)

export const insertPasswordSchema = createInsertSchema(passwords)

export const insertSessionSchema = createInsertSchema(sessions)

export const insertVerificationSchema = createInsertSchema(verifications)

export const insertConnectionSchema = createInsertSchema(connections)
