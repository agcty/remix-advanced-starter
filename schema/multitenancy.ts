import { relations, sql } from "drizzle-orm"
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { connections, passwords, sessions } from "./auth"

// Users can have multiple roles in multiple organizations.
// For example, a user could be the owner (admin) of one organization, but have a member role in another organization.
// Each of these roles comes with specific permissions for that particular organization.
// For a real-world example, think of a platform like LinkedIn, where the user has a global account but can be part of multiple companies or groups and have specific permissions in each of those.
// In some organizations, they might be an admin, in others a moderator, and in others simply a basic user.

export const organizations = sqliteTable("multitenancy_organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
})

export const users = sqliteTable("multitenancy_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  name: text("name"),
  email: text("email").notNull().unique(),
  globalRole: text("global_role").notNull().default("CUSTOMER"),
})

export const memberships = sqliteTable(
  "multitenancy_memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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

export const permissions = sqliteTable(
  "multitenancy_permissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    access: text("access").notNull(),
    description: text("description").default(""),
  },
  table => ({
    unq: unique().on(table.action, table.entity, table.access),
  }),
)

export const roles = sqliteTable("multitenancy_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description").default(""),
})

export const rolePermissions = sqliteTable(
  "multitenancy_role_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  table => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
)

export const membershipRoles = sqliteTable(
  "multitenancy_membership_roles",
  {
    membershipId: integer("membership_id")
      .notNull()
      .references(() => memberships.id),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
  },
  table => ({
    pk: primaryKey({ columns: [table.membershipId, table.roleId] }),
  }),
)

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
}))

export const usersRelations = relations(users, ({ many, one }) => ({
  memberships: many(memberships),
  password: one(passwords, {
    fields: [users.id],
    references: [passwords.userId],
  }),
  sessions: many(sessions),
  connections: many(connections),
}))

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  roles: many(membershipRoles),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  memberships: many(membershipRoles),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}))

export const insertUserSchema = createInsertSchema(users, {
  email: schema => schema.email.email(),
  globalRole: z.enum(["SUPERADMIN", "CUSTOMER"]).default("CUSTOMER"),
})

export const insertOrganizationSchema = createInsertSchema(organizations)

export const insertMembershipSchema = createInsertSchema(memberships)

export const insertPermissionSchema = createInsertSchema(permissions, {
  action: z.enum(["create", "read", "update", "delete"]),
  access: z.enum(["own", "any"]),
})

export const insertRoleSchema = createInsertSchema(roles)
