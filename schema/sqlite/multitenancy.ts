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

export const organizations = sqliteTable("mt_organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const users = sqliteTable("mt_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }),
  email: text("email", { length: 320 }).notNull().unique(),
  activeOrganizationId: integer("active_organization_id")
    .notNull()
    .references(() => organizations.id, { onUpdate: "cascade" }),
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
  "mt_memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
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
    uniqueOrgEmail: unique().on(table.organizationId, table.invitedEmail),
    uniqueUserOrg: unique().on(table.userId, table.organizationId),
  }),
)

export const permissions = sqliteTable(
  "mt_permissions",
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

export const roles = sqliteTable("mt_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).notNull().unique(),
  description: text("description", { length: 1000 }).default(""),
})

export const rolePermissions = sqliteTable(
  "mt_role_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade", onUpdate: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  table => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
)

export const membershipRoles = sqliteTable(
  "mt_membership_roles",
  {
    membershipId: integer("membership_id")
      .notNull()
      .references(() => memberships.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade", onUpdate: "cascade" }),
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

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
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

// Explanations for the added cascade statements:

// organizations table:

// No cascade statements added, as it's the root table.

// users table:

// Added onUpdate: "cascade" to activeOrganizationId. This ensures that if an organization's ID changes, the user's active organization reference is updated.

// memberships table:

// Added onDelete: "cascade", onUpdate: "cascade" to both organizationId and userId. This means:

// If an organization is deleted, all its memberships are automatically deleted.
// If a user is deleted, all their memberships are automatically deleted.
// If an organization's or user's ID is updated, the membership references are updated accordingly.

// rolePermissions table:

// Added onDelete: "cascade", onUpdate: "cascade" to both roleId and permissionId. This means:

// If a role is deleted, all its permission associations are automatically deleted.
// If a permission is deleted, all its role associations are automatically deleted.
// If a role's or permission's ID is updated, the associations are updated accordingly.

// membershipRoles table:

// Added onDelete: "cascade", onUpdate: "cascade" to both membershipId and roleId. This means:

// If a membership is deleted, all its role associations are automatically deleted.
// If a role is deleted, all its membership associations are automatically deleted.
// If a membership's or role's ID is updated, the associations are updated accordingly.

// These cascade statements are important for maintaining data integrity and consistency in your database. They ensure that:

// Related data is properly cleaned up when parent records are deleted, preventing orphaned records.
// References are kept up-to-date if primary keys are updated.
// The database maintains consistency without requiring additional application logic to manage these relationships.

// However, it's important to note that cascading deletes should be used carefully, as they can lead to unintended data loss if not properly managed. In this case, the cascade deletes are appropriate given the nature of the relationships between the entities in your multi-tenancy system.
// For the users table, we only added a cascade update for activeOrganizationId. We didn't add a cascade delete because deleting an organization shouldn't automatically delete its users. Users might belong to multiple organizations, and deleting all users when an organization is deleted could result in unexpected data loss.
