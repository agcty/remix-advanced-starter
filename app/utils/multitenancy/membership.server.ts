import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import * as schema from "schema/postgres"
import { type TransactionParam } from "schema/types"

// Not intended to be used directly, only exported for usage by inviteUserToOrganization
export async function createPendingMembership({
  organizationId,
  invitedEmail,
  invitedName,
  tx = db,
}: {
  organizationId: number
  invitedEmail: string
  invitedName?: string
} & TransactionParam): Promise<schema.Membership> {
  // Validate input data
  const validatedData = schema.insertMembershipSchema.parse({
    organizationId,
    invitedEmail,
    invitedName,
  })

  // Check if a membership (pending or active) already exists for this email in this organization
  const [existingMembership] = await tx
    .select()
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.organizationId, organizationId),
        eq(schema.memberships.invitedEmail, invitedEmail),
      ),
    )

  if (existingMembership) {
    throw new Error(
      "A membership already exists for this email in this organization",
    )
  }

  // Create the pending membership
  const [newMembership] = await tx
    .insert(schema.memberships)
    .values({
      organizationId: validatedData.organizationId,
      invitedEmail: validatedData.invitedEmail,
      invitedName: validatedData.invitedName,
    })
    .returning()

  return newMembership
}

export async function createMembership({
  userId,
  organizationId,
  tx = db,
}: {
  userId: number
  organizationId: number
} & TransactionParam): Promise<schema.Membership> {
  const [membership] = await tx
    .insert(schema.memberships)
    .values({
      organizationId,
      userId,
    })
    .returning()
  return membership
}

export async function addRoleToMembership({
  membershipId,
  roleName,
  tx = db,
}: {
  membershipId: number
  roleName: string
} & TransactionParam): Promise<void> {
  const [role] = await tx
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.name, roleName))

  if (!role) {
    throw new Error(
      `${roleName} role not found. Please ensure the database is properly seeded.`,
    )
  }

  await tx.insert(schema.membershipRoles).values({
    membershipId,
    roleId: role.id,
  })
}

export async function removeRoleFromMembership({
  membershipId,
  roleName,
  tx = db,
}: {
  membershipId: number
  roleName: string
} & TransactionParam): Promise<void> {
  const [role] = await tx
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.name, roleName))

  if (!role) {
    throw new Error(
      `${roleName} role not found. Please ensure the database is properly seeded.`,
    )
  }

  await tx
    .delete(schema.membershipRoles)
    .where(
      and(
        eq(schema.membershipRoles.membershipId, membershipId),
        eq(schema.membershipRoles.roleId, role.id),
      ),
    )
}

// removeMembership removes a membership from the database along with all associated roles

export async function removeMembership({
  membershipId,
  tx = db,
}: {
  membershipId: number
} & TransactionParam): Promise<void> {
  // Check if the membership exists
  const [existingMembership] = await tx
    .select()
    .from(schema.memberships)
    .where(eq(schema.memberships.id, membershipId))

  if (!existingMembership) {
    throw new Error(`Membership with id ${membershipId} not found`)
  }

  // Remove related membershipRoles
  await tx
    .delete(schema.membershipRoles)
    .where(eq(schema.membershipRoles.membershipId, membershipId))

  // Remove the membership
  const [result] = await tx
    .delete(schema.memberships)
    .where(eq(schema.memberships.id, membershipId))
    .returning()

  // Check if any rows were affected
  if (!result) {
    throw new Error(`Failed to remove membership with id ${membershipId}`)
  }
}
