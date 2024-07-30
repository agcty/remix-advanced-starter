import { relations, sql } from "drizzle-orm"
import {
  check,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

export enum MembershipRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum GlobalRole {
  SUPERADMIN = "SUPERADMIN",
  CUSTOMER = "CUSTOMER",
}

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

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
    checkRole: check(
      "check_role_constraint",
      sql`role IN ('SUPERADMIN', 'CUSTOMER')`,
    ),
  }),
)

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
    invitedEmail: text("invited_email"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    uniqueOrgEmail: unique("unique_org_email").on(
      table.organizationId,
      table.invitedEmail,
    ),
    checkRole: check(
      "check_membership_role_constraint",
      sql`role IN ('OWNER', 'ADMIN', 'USER')`,
    ),
  }),
)

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
