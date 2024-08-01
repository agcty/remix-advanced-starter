import { connection, db } from "db.server"
import { and, eq, sql } from "drizzle-orm"
import * as schema from "../schema/multitenancy"

export async function seed() {
  console.log("DATABASE_URL_SEED:", process.env.DATABASE_URL)
  try {
    // Seed Organizations
    const [org1, org2] = await db
      .insert(schema.organizations)
      .values([{ name: "Acme Corporation" }, { name: "Globex Corporation" }])
      .returning()

    // Seed Users
    const [user1, user2, user3] = await db
      .insert(schema.users)
      .values([
        {
          name: "John Doe",
          email: "john@example.com",
          globalRole: "CUSTOMER",
          activeOrganizationId: org1.id,
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
          globalRole: "CUSTOMER",
          activeOrganizationId: org1.id,
        },
        {
          name: "Admin User",
          email: "admin@example.com",
          globalRole: "SUPERADMIN",
          activeOrganizationId: org2.id,
        },
      ])
      .returning()

    // Seed Memberships
    const [membership1, membership2, membership3, membership4] = await db
      .insert(schema.memberships)
      .values([
        { organizationId: org1.id, userId: user1.id },
        { organizationId: org1.id, userId: user2.id },
        { organizationId: org2.id, userId: user1.id },
        { organizationId: org2.id, userId: user3.id },
      ])
      .returning()

    // Seed Permissions
    const permissionValues = [
      {
        action: "create",
        entity: "user",
        access: "any",
        description: "Create any user",
      },
      {
        action: "read",
        entity: "user",
        access: "any",
        description: "Read any user",
      },
      {
        action: "update",
        entity: "user",
        access: "any",
        description: "Update any user",
      },
      {
        action: "delete",
        entity: "user",
        access: "any",
        description: "Delete any user",
      },
      {
        action: "create",
        entity: "organization",
        access: "any",
        description: "Create organization",
      },
      {
        action: "read",
        entity: "organization",
        access: "any",
        description: "Read organization",
      },
      {
        action: "update",
        entity: "organization",
        access: "any",
        description: "Update organization",
      },
      {
        action: "delete",
        entity: "organization",
        access: "any",
        description: "Delete organization",
      },
      {
        action: "create",
        entity: "post",
        access: "own",
        description: "Create own post",
      },
      {
        action: "read",
        entity: "post",
        access: "any",
        description: "Read any post",
      },
      {
        action: "update",
        entity: "post",
        access: "own",
        description: "Update own post",
      },
      {
        action: "delete",
        entity: "post",
        access: "own",
        description: "Delete own post",
      },
      {
        action: "update",
        entity: "post",
        access: "any",
        description: "Update any post",
      },
      {
        action: "delete",
        entity: "post",
        access: "any",
        description: "Delete any post",
      },
    ]

    const permissions = await Promise.all(
      permissionValues.map(async perm => {
        const existingPerm = await db
          .select()
          .from(schema.permissions)
          .where(
            and(
              eq(schema.permissions.action, perm.action),
              eq(schema.permissions.entity, perm.entity),
              eq(schema.permissions.access, perm.access),
            ),
          )
          .limit(1)

        if (existingPerm.length > 0) {
          return existingPerm[0]
        } else {
          const [newPerm] = await db
            .insert(schema.permissions)
            .values(perm)
            .returning()
          return newPerm
        }
      }),
    )

    // Seed Roles
    const [ownerRole, adminRole, memberRole] = await db
      .insert(schema.roles)
      .values([
        {
          name: "OWNER",
          description: "Organization owner with full permissions",
        },
        { name: "ADMIN", description: "Administrator role" },
        { name: "MEMBER", description: "Regular member role" },
      ])
      .returning()

    // Define type-safe filtering functions
    const isMemberAllowed = (
      permission: (typeof permissions)[number],
    ): boolean => {
      return permission.action === "read" || permission.access === "own"
    }

    const isAdminAllowed = (
      permission: (typeof permissions)[number],
    ): boolean => {
      return !(
        permission.entity === "organization" && permission.action === "delete"
      )
    }

    // Seed Role Permissions with improved type safety
    const rolePermissions = permissions.flatMap(permission => {
      const ownerPermission = {
        roleId: ownerRole.id,
        permissionId: permission.id,
      }
      const adminPermission = isAdminAllowed(permission)
        ? { roleId: adminRole.id, permissionId: permission.id }
        : null
      const memberPermission = isMemberAllowed(permission)
        ? { roleId: memberRole.id, permissionId: permission.id }
        : null

      return [ownerPermission, adminPermission, memberPermission].filter(
        (p): p is NonNullable<typeof p> => p !== null,
      )
    })

    await db.insert(schema.rolePermissions).values(rolePermissions)

    // Seed Membership Roles
    await db.insert(schema.membershipRoles).values([
      { membershipId: membership1.id, roleId: ownerRole.id },
      { membershipId: membership2.id, roleId: memberRole.id },
      { membershipId: membership3.id, roleId: memberRole.id },
      { membershipId: membership4.id, roleId: adminRole.id },
    ])

    console.log("Seeding completed successfully")
  } catch (error) {
    console.error("Error during seeding:", error)
  } finally {
    console.log("Exiting seeding function")
    // connection.close()
  }
}

export async function cleanup() {
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
