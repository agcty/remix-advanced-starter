import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"

// Enums
export const MembershipRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  USER: "USER",
} as const

export const GlobalRole = {
  SUPERADMIN: "SUPERADMIN",
  CUSTOMER: "CUSTOMER",
} as const

// Enum types
// type MembershipRoleType = (typeof MembershipRole)[keyof typeof MembershipRole]
// type GlobalRoleType = (typeof GlobalRole)[keyof typeof GlobalRole]

// Organization table
export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
})

// User table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  name: text("name"),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
})

// Membership table
export const memberships = sqliteTable(
  "memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    role: text("role").notNull(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: integer("user_id").references(() => users.id),
    invitedName: text("invited_name"),
    invitedEmail: text("invited_email"),
  },
  table => ({
    uniqueOrgEmail: unique().on(table.organizationId, table.invitedEmail),
  }),
)

// Relations
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
