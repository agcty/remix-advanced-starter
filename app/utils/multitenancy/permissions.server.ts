import { db } from "db.server"
import { and, eq, sql } from "drizzle-orm"
import {
  membershipRoles,
  memberships,
  permissions,
  rolePermissions,
  roles,
} from "schema/postgres"

type Action = "create" | "read" | "update" | "delete"
type Entity = string
type Access = "own" | "any" | "own,any" | "any,own"

export type PermissionString =
  | `${Action}:${Entity}`
  | `${Action}:${Entity}:${Access}`

/**
 * Parses a permission string into its components.
 *
 * @param permissionString - A string representing a permission in the format "action:entity" or "action:entity:access".
 * @returns An object containing the parsed action, entity, and access (if present).
 *
 * This function splits the input string by colon (':') and interprets the parts as action, entity, and optionally access.
 * If access is not provided in the string, it will be undefined in the returned object.
 */
export function parsePermissionString(permissionString: PermissionString) {
  const [action, entity, access] = permissionString.split(":") as [
    Action,
    Entity,
    Access | undefined,
  ]
  return {
    action,
    entity,
    access: access ? (access.split(",") as Array<Access>) : undefined,
  }
}

interface UserPermissionParams {
  userId: number
  organizationId: number
  permissionString: PermissionString
}

interface UserRoleParams {
  userId: number
  organizationId: number
  roleName: string
}

/**
 * Checks if a user has a specific permission within an organization.
 *
 * @param params - An object containing userId, organizationId, and permissionString.
 * @returns A Promise that resolves to a boolean indicating whether the user has the specified permission.
 *
 * This function performs a complex database query to check for the user's permission:
 * 1. It starts from the memberships table to ensure the user belongs to the specified organization.
 * 2. It joins with membershipRoles to get the roles associated with this membership.
 * 3. It then joins with roles, rolePermissions, and permissions tables to fetch the permissions associated with these roles.
 * 4. The where clause filters the results to match the specific user, organization, entity, action, and access level (if specified).
 * 5. The query is prepared with a name for potential reuse and better performance.
 * 6. If any matching permissions are found (length > 0), it means the user has the permission, and the function returns true.
 */
export async function userHasPermission({
  userId,
  organizationId,
  permissionString,
}: UserPermissionParams): Promise<boolean> {
  const { action, entity, access } = parsePermissionString(permissionString)

  const query = db
    .select({
      action: permissions.action,
      entity: permissions.entity,
      access: permissions.access,
    })
    .from(memberships)
    .innerJoin(
      membershipRoles,
      eq(membershipRoles.membershipId, memberships.id),
    )
    .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(memberships.userId, sql.placeholder("userId")),
        eq(memberships.organizationId, sql.placeholder("organizationId")),
        eq(permissions.entity, sql.placeholder("entity")),
        eq(permissions.action, sql.placeholder("action")),
        access
          ? sql`${permissions.access} = ANY(${sql.placeholder("access")})`
          : sql`${permissions.access} IS NULL`,
      ),
    )
    .prepare("check_user_permission")

  const userPermissions = await query.execute({
    userId,
    organizationId,
    entity,
    action,
    access: access || [],
  })

  console.log({ userPermissions })

  return userPermissions.length > 0
}

/**
 * Checks if a user has a specific role within an organization.
 *
 * @param params - An object containing userId, organizationId, and roleName.
 * @returns A Promise that resolves to a boolean indicating whether the user has the specified role.
 *
 * This function performs a database query to check for the user's role:
 * 1. It starts from the memberships table to ensure the user belongs to the specified organization.
 * 2. It joins with membershipRoles to get the roles associated with this membership.
 * 3. It then joins with the roles table to get the role names.
 * 4. The where clause filters the results to match the specific user, organization, and role name.
 * 5. The query is prepared with a name for potential reuse and better performance.
 * 6. If any matching roles are found (length > 0), it means the user has the role, and the function returns true.
 */
export async function userHasRole({
  userId,
  organizationId,
  roleName,
}: UserRoleParams): Promise<boolean> {
  const query = db
    .select({ name: roles.name })
    .from(memberships)
    .innerJoin(
      membershipRoles,
      eq(membershipRoles.membershipId, memberships.id),
    )
    .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
    .where(
      and(
        eq(memberships.userId, sql.placeholder("userId")),
        eq(memberships.organizationId, sql.placeholder("organizationId")),
        eq(roles.name, sql.placeholder("roleName")),
      ),
    )
    .prepare("check_user_role")

  const userRoles = await query.execute({
    userId,
    organizationId,
    roleName,
  })

  return userRoles.length > 0
}

export async function getPermissionsByRoleName(roleName: string) {
  const result = await db
    .select({
      roleName: roles.name,
      permissionId: permissions.id,
      action: permissions.action,
      entity: permissions.entity,
      access: permissions.access,
      description: permissions.description,
    })
    .from(roles)
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(roles.name, roleName))

  return result
}

export async function createPermission({
  entity,
  action,
  access,
}: {
  entity: Entity
  action: Action
  access: Access
}): Promise<number> {
  const [result] = await db
    .insert(permissions)
    .values({
      entity,
      action,
      access,
      description: `${action} ${access} ${entity}`,
    })
    .returning({ id: permissions.id })

  return result.id
}

export async function addPermissionToRole({
  roleName,
  permissionId,
}: {
  roleName: string
  permissionId: number
}): Promise<void> {
  const role = await db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  })

  if (!role) {
    throw new Error(`Role "${roleName}" not found`)
  }

  await db.insert(rolePermissions).values({
    roleId: role.id,
    permissionId,
  })
}

export async function removePermissionFromRole({
  roleName,
  permissionId,
}: {
  roleName: string
  permissionId: number
}): Promise<void> {
  const role = await db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  })

  if (!role) {
    throw new Error(`Role "${roleName}" not found`)
  }

  await db
    .delete(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleId, role.id),
        eq(rolePermissions.permissionId, permissionId),
      ),
    )
}

export async function deletePermission(permissionId: number): Promise<void> {
  const permission = await db.query.permissions.findFirst({
    where: eq(permissions.id, permissionId),
  })

  if (!permission) {
    throw new Error(`Permission with id ${permissionId} not found`)
  }

  await db.delete(permissions).where(eq(permissions.id, permissionId))
}
