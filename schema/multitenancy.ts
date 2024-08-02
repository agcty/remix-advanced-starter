import {
  type InferInsertModel,
  type InferSelectModel,
  relations,
  sql,
} from "drizzle-orm"
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { connections, passwords, sessions } from "./auth"

// Users can have multiple roles in multiple organizations.
// For example, a user could be the owner (admin) of one organization, but have a member role in another organization.
// Each of these roles comes with specific permissions for that particular organization.
// For a real-world example, think of a platform like LinkedIn, where the user has a global account but can be part of multiple companies or groups and have specific permissions in each of those.
// In some organizations, they might be an admin, in others a moderator, and in others simply a basic user.
// A user can have multiple roles in the same organization as well but only one membership per organization.

export const organizations = sqliteTable("multitenancy_organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const users = sqliteTable("multitenancy_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }),
  email: text("email", { length: 320 }).notNull().unique(),
  activeOrganizationId: integer("active_organization_id")
    .notNull()
    .references(() => organizations.id),
  globalRole: text("global_role", { enum: ["SUPERADMIN", "CUSTOMER"] })
    .notNull()
    .default("CUSTOMER"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const memberships = sqliteTable(
  "multitenancy_memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: integer("user_id").references(() => users.id),
    invitedName: text("invited_name", { length: 255 }),
    invitedEmail: text("invited_email", { length: 320 }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    // A user can only be invited once to an organization
    uniqueOrgEmail: unique().on(table.organizationId, table.invitedEmail),
    // A user can only have one membership in an organization
    uniqueUserOrg: unique().on(table.userId, table.organizationId),
  }),
)

export const permissions = sqliteTable(
  "multitenancy_permissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    action: text("action", {
      enum: ["create", "read", "update", "delete"],
    }).notNull(),
    entity: text("entity", { length: 100 }).notNull(),
    access: text("access", { enum: ["own", "any"] }).notNull(),
    description: text("description", { length: 1000 }).default(""),
  },
  table => ({
    unq: unique().on(table.action, table.entity, table.access),
  }),
)

export const roles = sqliteTable("multitenancy_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).notNull().unique(),
  description: text("description", { length: 1000 }).default(""),
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

export const membershipRolesRelations = relations(
  membershipRoles,
  ({ one }) => ({
    membership: one(memberships, {
      fields: [membershipRoles.membershipId],
      references: [memberships.id],
    }),
    role: one(roles, {
      fields: [membershipRoles.roleId],
      references: [roles.id],
    }),
  }),
)

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

export const selectUserSchema = createSelectSchema(users)

export const insertOrganizationSchema = createInsertSchema(organizations)

export const insertMembershipSchema = createInsertSchema(memberships)

export const insertPermissionSchema = createInsertSchema(permissions, {
  action: z.enum(["create", "read", "update", "delete"]),
  access: z.enum(["own", "any"]),
})

export const insertRoleSchema = createInsertSchema(roles)

// Add these type definitions at the end of your schema file
export type User = InferSelectModel<typeof users>
export type Organization = InferSelectModel<typeof organizations>
export type Membership = InferSelectModel<typeof memberships>
export type Role = InferSelectModel<typeof roles>

export type InsertUser = InferInsertModel<typeof users>
export type InsertOrganization = InferInsertModel<typeof organizations>
export type InsertMembership = InferInsertModel<typeof memberships>
export type InsertRole = InferInsertModel<typeof roles>
export type Permission = InferSelectModel<typeof permissions>
export type InsertPermission = InferInsertModel<typeof permissions>

// AI Questions you can ask to understand this file better:
// Does this drizzle schema adhere to the best practices and the schema description?
