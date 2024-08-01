import { connection, db } from "db.server"
// import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import * as schema from "../schema/multitenancy" // Assuming the schema is in a file named schema.ts

async function seed() {
  // Initialize the database connection

  // Run migrations to ensure the database is up to date
  //   migrate(db, { migrationsFolder: "./migrations" })

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
        { name: "John Doe", email: "john@example.com", globalRole: "CUSTOMER" },
        {
          name: "Jane Smith",
          email: "jane@example.com",
          globalRole: "CUSTOMER",
        },
        {
          name: "Admin User",
          email: "admin@example.com",
          globalRole: "SUPERADMIN",
        },
      ])
      .returning()

    // Seed Memberships
    await db.insert(schema.memberships).values([
      { organizationId: org1.id, userId: user1.id },
      { organizationId: org1.id, userId: user2.id },
      { organizationId: org2.id, userId: user1.id },
      { organizationId: org2.id, userId: user3.id },
    ])

    // Seed Permissions
    const [
      createPermission,
      readPermission,
      updatePermission,
      deletePermission,
    ] = await db
      .insert(schema.permissions)
      .values([
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
      ])
      .returning()

    // Seed Roles
    const [adminRole, memberRole] = await db
      .insert(schema.roles)
      .values([
        { name: "Admin", description: "Administrator role" },
        { name: "Member", description: "Regular member role" },
      ])
      .returning()

    // Seed Role Permissions
    await db.insert(schema.rolePermissions).values([
      { roleId: adminRole.id, permissionId: createPermission.id },
      { roleId: adminRole.id, permissionId: readPermission.id },
      { roleId: adminRole.id, permissionId: updatePermission.id },
      { roleId: adminRole.id, permissionId: deletePermission.id },
      { roleId: memberRole.id, permissionId: createPermission.id },
      { roleId: memberRole.id, permissionId: readPermission.id },
      { roleId: memberRole.id, permissionId: updatePermission.id },
    ])

    // Seed Membership Roles
    const membershipIds = await db
      .select({ id: schema.memberships.id })
      .from(schema.memberships)

    for (const membership of membershipIds) {
      await db
        .insert(schema.membershipRoles)
        .values({ membershipId: membership.id, roleId: memberRole.id })
    }

    console.log("Seeding completed successfully")
  } catch (error) {
    console.error("Error during seeding:", error)
  } finally {
    // Close the database connection
    console.log("Exiting seeding function")
    connection.close()
  }
}

// Run the seeding function
seed()
