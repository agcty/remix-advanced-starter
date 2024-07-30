import { relations, sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

// Changed from object literals to enums
export enum MembershipRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum GlobalRole {
  SUPERADMIN = "SUPERADMIN",
  CUSTOMER = "CUSTOMER",
}

// Organization table
export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // Added createdAt and updatedAt fields
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

// User table
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    name: text("name"),
    email: text("email").notNull().unique(),
    role: text("role").$type<GlobalRole>().notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  table => ({
    emailIdx: index("email_idx").on(table.email),
    // Added check constraint for role values
    checkRole: check(
      "check_role_constraint",
      sql`role IN ('SUPERADMIN', 'CUSTOMER')`,
    ),
  }),
)

// Membership table
export const memberships = sqliteTable(
  "memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    role: text("role").$type<MembershipRole>().notNull(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    invitedName: text("invited_name"),
    // Changed to be unique across all organizations
    invitedEmail: text("invited_email").unique(),
    // Added createdAt and updatedAt fields
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    // Removed uniqueOrgEmail constraint
    // Added indexes for foreign keys
    orgIdIdx: index("org_id_idx").on(table.organizationId),
    userIdIdx: index("user_id_idx").on(table.userId),
    // Added check constraint for role values
    checkRole: check(
      "check_role_constraint",
      sql`role IN ('OWNER', 'ADMIN', 'USER')`,
    ),
  }),
)

// Relations (unchanged)
export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
}))

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}))
