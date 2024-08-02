/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import * as schema from "../schema/multitenancy"

export async function seed(): Promise<void> {
  try {
    // Create basic roles and permissions: OWNER, ADMIN, MEMBER
    const roles = await createDefaultRoles()
    const permissions = await createDefaultPermissions()
    await createRolePermissions({ roles, permissions })

    // Create organizations, users, and memberships for testing
    // const organizations = await createMockOrganizations({ amount: 2 })
    // const users = await createMockUsers({ amount: 3, organizations })
    // const memberships = await createMockMemberships({ users, organizations })
    // await createMembershipRoles({ memberships, roles })

    console.log("Seeding completed successfully")
  } catch (error) {
    console.error("Error during seeding:", error)
  } finally {
    console.log("Exiting seeding function")
  }
}

async function createDefaultRoles() {
  const rolesToCreate = [
    { name: "OWNER", description: "Full access to organization resources" },
    { name: "ADMIN", description: "Manage organization resources and users" },
    { name: "MEMBER", description: "Basic access to organization resources" },
  ]

  const createdRoles = []

  for (const role of rolesToCreate) {
    try {
      // Validate the role data
      const validatedRole = schema.insertRoleSchema.parse(role)

      // Check if the role already exists
      const existingRole = await db.query.roles.findFirst({
        where: eq(schema.roles.name, validatedRole.name),
      })

      if (existingRole) {
        console.log(
          `Role ${validatedRole.name} already exists, skipping creation`,
        )
        createdRoles.push(existingRole)
      } else {
        // Create the role
        const [insertedRole] = await db
          .insert(schema.roles)
          .values(validatedRole)
          .returning()
        console.log(`Created role: ${insertedRole.name}`)
        createdRoles.push(insertedRole)
      }
    } catch (error) {
      console.error(`Error creating role ${role.name}:`, error)
    }
  }

  return createdRoles
}

// Helper function to create permissions for a single entity
async function createEntityPermissions(entity: string) {
  const actions = ["create", "read", "update", "delete"] as const
  const accessLevels = ["own", "any"] as const
  const createdPermissions = []

  for (const action of actions) {
    for (const access of accessLevels) {
      // Skip 'create' and 'delete' for 'own' access as they don't make sense
      if ((action === "create" || action === "delete") && access === "own") {
        continue
      }

      const permissionData = {
        action,
        entity,
        access,
        description: `${action} ${access} ${entity}`,
      }

      try {
        // Validate the permission data
        const validatedPermission =
          schema.insertPermissionSchema.parse(permissionData)

        // Check if the permission already exists
        const existingPermission = await db.query.permissions.findFirst({
          where: and(
            eq(schema.permissions.action, validatedPermission.action),
            eq(schema.permissions.entity, validatedPermission.entity),
            eq(schema.permissions.access, validatedPermission.access),
          ),
        })

        if (existingPermission) {
          console.log(
            `Permission ${validatedPermission.description} already exists, skipping creation`,
          )
          createdPermissions.push(existingPermission)
        } else {
          // Create the permission
          const [insertedPermission] = await db
            .insert(schema.permissions)
            .values(validatedPermission)
            .returning()
          console.log(`Created permission: ${insertedPermission.description}`)
          createdPermissions.push(insertedPermission)
        }
      } catch (error) {
        console.error(
          `Error creating permission ${permissionData.description}:`,
          error,
        )
      }
    }
  }

  return createdPermissions
}

// Main function to create all permissions
async function createDefaultPermissions() {
  const entities = ["user", "organization", "membership", "role"]
  let allPermissions: any = []

  for (const entity of entities) {
    const entityPermissions = await createEntityPermissions(entity)
    allPermissions = allPermissions.concat(entityPermissions)
  }

  return allPermissions
}

type Role = typeof schema.roles.$inferSelect
type Permission = typeof schema.permissions.$inferSelect

async function createRolePermissions({
  roles,
  permissions,
}: {
  roles: Role[]
  permissions: Permission[]
}) {
  const rolePermissionsToCreate = [
    {
      roleName: "OWNER",
      actions: ["create", "read", "update", "delete"],
      access: ["own", "any"],
    },
    {
      roleName: "ADMIN",
      actions: ["create", "read", "update", "delete"],
      access: ["own", "any"],
    },
    {
      roleName: "MEMBER",
      actions: ["create", "read", "update", "delete"],
      access: ["own"],
    },
  ]

  const rolePermissionValues: any = []

  for (const rolePermission of rolePermissionsToCreate) {
    const role = roles.find(r => r.name === rolePermission.roleName)
    if (!role) {
      console.error(`Role ${rolePermission.roleName} not found`)
      continue
    }

    for (const action of rolePermission.actions) {
      for (const access of rolePermission.access) {
        const permission = permissions.find(
          p => p.action === action && p.access === access,
        )
        if (!permission) {
          console.error(
            `Permission not found for action: ${action}, access: ${access}`,
          )
          continue
        }

        rolePermissionValues.push({
          roleId: role.id,
          permissionId: permission.id,
        })
      }
    }
  }

  if (rolePermissionValues.length > 0) {
    try {
      // Use a transaction to ensure atomicity
      await db.transaction(async tx => {
        for (const value of rolePermissionValues) {
          // Check if the role-permission association already exists
          const existingRolePermission =
            await tx.query.rolePermissions.findFirst({
              where: and(
                eq(schema.rolePermissions.roleId, value.roleId),
                eq(schema.rolePermissions.permissionId, value.permissionId),
              ),
            })

          if (!existingRolePermission) {
            // If it doesn't exist, insert it
            await tx.insert(schema.rolePermissions).values(value)
            console.log(
              `Created role-permission: Role ID ${value.roleId}, Permission ID ${value.permissionId}`,
            )
          } else {
            console.log(
              `Role-permission already exists: Role ID ${value.roleId}, Permission ID ${value.permissionId}`,
            )
          }
        }
      })
    } catch (error) {
      console.error("Error creating role permissions:", error)
    }
  }
}

export async function teardown() {
  console.log("🗑️ Emptying the database")

  // Start a transaction
  return await db.transaction(async tx => {
    try {
      // Delete data in reverse order of dependencies
      await tx.delete(schema.membershipRoles).execute()
      await tx.delete(schema.rolePermissions).execute()
      await tx.delete(schema.memberships).execute()
      await tx.delete(schema.users).execute()
      await tx.delete(schema.organizations).execute()
      await tx.delete(schema.roles).execute()
      await tx.delete(schema.permissions).execute()

      // If you have other tables, add them here in the appropriate order

      console.log("Database cleanup completed successfully")
    } catch (error) {
      console.error("Error during cleanup:", error)
      throw error // Re-throw the error to trigger a rollback
    }
  })
}
