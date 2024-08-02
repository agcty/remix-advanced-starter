import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import * as schema from "schema/multitenancy"
import { type TransactionParam } from "schema/types"

export function createPendingMembership({
  organizationId,
  invitedEmail,
  invitedName,
  tx = db,
}: {
  organizationId: number
  invitedEmail: string
  invitedName?: string
} & TransactionParam): schema.Membership {
  // Validate input data
  const validatedData = schema.insertMembershipSchema.parse({
    organizationId,
    invitedEmail,
    invitedName,
  })

  // Check if a membership (pending or active) already exists for this email in this organization
  const existingMembership = tx
    .select()
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.organizationId, organizationId),
        eq(schema.memberships.invitedEmail, invitedEmail),
      ),
    )
    .get()

  if (existingMembership) {
    throw new Error(
      "A membership already exists for this email in this organization",
    )
  }

  // Create the pending membership
  return tx
    .insert(schema.memberships)
    .values({
      organizationId: validatedData.organizationId,
      invitedEmail: validatedData.invitedEmail,
      invitedName: validatedData.invitedName,
    })
    .returning()
    .get()
}

export function createMembership({
  userId,
  organizationId,
  tx = db,
}: {
  userId: number
  organizationId: number
} & TransactionParam): schema.Membership {
  return tx
    .insert(schema.memberships)
    .values({
      organizationId,
      userId,
    })
    .returning()
    .get()
}

export function addRoleToMembership({
  membershipId,
  roleName,
  tx = db,
}: { membershipId: number; roleName: string } & TransactionParam): void {
  const role = tx
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.name, roleName))
    .get()

  if (!role) {
    throw new Error(
      `${roleName} role not found. Please ensure the database is properly seeded.`,
    )
  }

  tx.insert(schema.membershipRoles)
    .values({
      membershipId,
      roleId: role.id,
    })
    .run()
}

export function removeRoleFromMembership({
  membershipId,
  roleName,
  tx = db,
}: { membershipId: number; roleName: string } & TransactionParam): void {
  const role = tx
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.name, roleName))
    .get()

  if (!role) {
    throw new Error(
      `${roleName} role not found. Please ensure the database is properly seeded.`,
    )
  }

  tx.delete(schema.membershipRoles)
    .where(
      and(
        eq(schema.membershipRoles.membershipId, membershipId),
        eq(schema.membershipRoles.roleId, role.id),
      ),
    )
    .run()
}

// removeMembership removes a membership from the database along with all associated roles
