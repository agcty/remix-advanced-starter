import { json } from "@remix-run/node"
import { db } from "db.server"
import { and, eq, inArray } from "drizzle-orm"
import {
  membershipRoles,
  memberships,
  permissions,
  rolePermissions,
  roles,
  users,
} from "../../schema/multitenancy"
import { requireUserId } from "./auth.server.ts"
import { parsePermissionString, type PermissionString } from "./user"

export async function requireUserWithPermission(
  request: Request,
  permissionString: PermissionString,
) {
  const userId = await requireUserId(request)
  const { action, entity, access } = parsePermissionString(permissionString)

  const user = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(memberships, eq(memberships.userId, users.id))
    .leftJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
    .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(users.id, userId),
        eq(permissions.action, action),
        eq(permissions.entity, entity),
        access ? inArray(permissions.access, access) : undefined,
      ),
    )
    .limit(1)

  if (user.length === 0) {
    throw json(
      {
        error: "Unauthorized",
        requiredPermission: { action, entity, access },
        message: `Unauthorized: required permissions: ${permissionString}`,
      },
      { status: 403 },
    )
  }

  return user[0].id
}

export async function requireUserWithRole(request: Request, roleName: string) {
  const userId = await requireUserId(request)

  const user = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(memberships, eq(memberships.userId, users.id))
    .leftJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
    .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
    .where(and(eq(users.id, userId), eq(roles.name, roleName)))
    .limit(1)

  if (user.length === 0) {
    throw json(
      {
        error: "Unauthorized",
        requiredRole: roleName,
        message: `Unauthorized: required role: ${roleName}`,
      },
      { status: 403 },
    )
  }

  return user[0].id
}
