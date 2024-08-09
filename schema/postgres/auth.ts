import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { users } from "./multitenancy"

export const passwords = pgTable("auth_passwords", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
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
      .references(() => users.id, { onDelete: "cascade" }),
    expirationDate: timestamp("expiration_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  table => ({
    userIdIdx: index("user_sessions_id_idx").on(table.userId),
  }),
)

export const verifications = pgTable(
  "auth_verifications",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    // The type of verification, e.g. "email" or "phone"
    type: varchar("type", { length: 50 }).notNull(),
    // The thing we're trying to verify, e.g. a user's email or phone number
    target: varchar("target", { length: 255 }).notNull(),
    // The secret key used to generate the otp
    secret: text("secret").notNull(),
    // The algorithm used to generate the otp
    algorithm: varchar("algorithm", { length: 50 }).notNull(),
    // The number of digits in the otp
    digits: integer("digits").notNull(),
    // The number of seconds the otp is valid for
    period: integer("period").notNull(),
    // The valid characters for the otp
    charSet: varchar("char_set", { length: 100 }).notNull(),
    // When it's safe to delete this verification
    expiresAt: timestamp("expires_at").notNull(),
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
      .references(() => users.id, { onDelete: "cascade" }),
    // The name of the provider (e.g. "google")
    providerName: varchar("provider_name", { length: 50 }).notNull(),
    // The id of the user at the provider (e.g. Google's user id)
    providerId: varchar("provider_id", { length: 255 }).notNull(),
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
