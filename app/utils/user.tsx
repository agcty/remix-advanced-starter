import { type SerializeFrom } from "@remix-run/node"
import { useRouteLoaderData } from "@remix-run/react"
import { db } from "db.server"
import { eq } from "drizzle-orm"
import { type loader as rootLoader } from "~/root"
import {
  membershipRoles,
  memberships,
  permissions,
  rolePermissions,
  roles,
  users,
} from "../../schema/postgres/multitenancy"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isUser(user: any): user is SerializeFrom<typeof rootLoader>["user"] {
  return user && typeof user === "object" && typeof user.id === "string"
}

export function useOptionalUser() {
  const data = useRouteLoaderData<typeof rootLoader>("root")
  if (!data || !isUser(data.user)) {
    return undefined
  }
  return data.user
}

export function useUser() {
  const maybeUser = useOptionalUser()
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    )
  }
  return maybeUser
}

type Action = "create" | "read" | "update" | "delete"
type Entity = string
type Access = "own" | "any"
export type PermissionString =
  | `${Action}:${Entity}`
  | `${Action}:${Entity}:${Access}`

export function parsePermissionString(permissionString: PermissionString) {
  const [action, entity, access] = permissionString.split(":") as [
    Action,
    Entity,
    Access | undefined,
  ]
  return {
    action,
    entity,
    access: access ? [access as Access] : undefined,
  }
}

export async function userHasPermission(
  userId: number,
  permissionString: PermissionString,
): Promise<boolean> {
  const { action, entity, access } = parsePermissionString(permissionString)

  const userPermissions = await db
    .select({
      action: permissions.action,
      entity: permissions.entity,
      access: permissions.access,
    })
    .from(users)
    .leftJoin(memberships, eq(memberships.userId, users.id))
    .leftJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
    .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(users.id, userId))

  return userPermissions.some(
    permission =>
      permission.entity === entity &&
      permission.action === action &&
      (!access || access.includes(permission.access as Access)),
  )
}

export async function userHasRole(
  userId: number,
  roleName: string,
): Promise<boolean> {
  const userRoles = await db
    .select({ name: roles.name })
    .from(users)
    .leftJoin(memberships, eq(memberships.userId, users.id))
    .leftJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
    .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
    .where(eq(users.id, userId))

  return userRoles.some(role => role.name === roleName)
}
