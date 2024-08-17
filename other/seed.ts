/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "db.server"
import { sql } from "drizzle-orm"
import * as schema from "schema/postgres"
import { type InsertPermission } from "schema/postgres"
import {
  type Action,
  addPermissionToRole,
  createPermission,
  type Entity,
} from "~/utils/multitenancy/permissions.server"
import { createRole } from "~/utils/multitenancy/roles.server"

export async function seed(): Promise<void> {
  try {
    console.log("Starting seeding process...")

    // Create default roles
    await createRole({
      name: "OWNER",
      description: "Full access to organization resources",
    })
    await createRole({
      name: "ADMIN",
      description: "Manage organization resources and users",
    })
    await createRole({
      name: "MEMBER",
      description: "Basic access to organization resources",
    })

    console.log("Default roles created successfully")

    // Define entities, actions, and access levels
    const entities = ["user", "organization", "membership", "role"]
    const actions = ["create", "read", "update", "delete"]
    const accessLevels = ["own", "any"]

    // Create permissions and assign them to roles
    for (const entity of entities) {
      for (const action of actions) {
        for (const access of accessLevels) {
          const permissionId = await createPermission({
            entity: entity as Entity,
            action: action as Action,
            access: access as InsertPermission["access"],
          })

          // Assign permissions to roles based on their level
          await addPermissionToRole({ roleName: "OWNER", permissionId })
          await addPermissionToRole({ roleName: "ADMIN", permissionId })

          // Assign 'own' access permissions to MEMBER role
          if (access === "own") {
            await addPermissionToRole({ roleName: "MEMBER", permissionId })
          }
        }
      }
    }

    console.log("Permissions created and assigned to roles successfully")

    console.log("Seeding completed successfully")
  } catch (error) {
    console.error("Error during seeding:", error)
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
      await tx.delete(schema.connections).execute()
      await tx.delete(schema.sessions).execute()
      await tx.delete(schema.passwords).execute()
      await tx.delete(schema.verifications).execute()
      await tx.delete(schema.users).execute()
      await tx.delete(schema.organizations).execute()
      await tx.delete(schema.roles).execute()
      await tx.delete(schema.permissions).execute()

      // tx.execute(sql`DELETE FROM sqlite_sequence`)

      // Reset sequences for each table
      await tx.execute(sql`
        DO $$ DECLARE
          seq RECORD;
        BEGIN
          FOR seq IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
          LOOP
            EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq.sequence_name) || ' RESTART WITH 1';
          END LOOP;
        END $$;
      `)

      console.log("Database cleanup completed successfully")
    } catch (error) {
      console.error("Error during cleanup:", error)
      throw error // Re-throw the error to trigger a rollback
    }
  })
}
