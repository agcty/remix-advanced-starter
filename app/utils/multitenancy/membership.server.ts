import { and, eq } from "drizzle-orm"
import * as schema from "schema/multitenancy"
import { withTransaction, type WithTransactionParams } from "schema/types"

// Not intended to be used directly, only exported for usage by inviteUserToOrganization
export const createPendingMembership = withTransaction(
  async ({
    organizationId,
    invitedEmail,
    invitedName,
    tx,
  }: WithTransactionParams<{
    organizationId: number
    invitedEmail: string
    invitedName?: string
  }>) => {
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
  },
)

export const createMembership = withTransaction(
  async ({
    userId,
    organizationId,
    tx,
  }: WithTransactionParams<{
    userId: number
    organizationId: number
  }>) => {
    return tx
      .insert(schema.memberships)
      .values({
        organizationId,
        userId,
      })
      .returning()
      .get()
  },
)

export const addRoleToMembership = withTransaction(
  async ({
    membershipId,
    roleName,
    tx,
  }: WithTransactionParams<{
    membershipId: number
    roleName: string
  }>) => {
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
  },
)

export const removeRoleFromMembership = withTransaction(
  async ({
    membershipId,
    roleName,
    tx,
  }: WithTransactionParams<{
    membershipId: number
    roleName: string
  }>) => {
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
  },
)

export const removeMembership = withTransaction(
  async ({
    membershipId,
    tx,
  }: WithTransactionParams<{ membershipId: number }>) => {
    // Check if the membership exists
    const existingMembership = tx
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.id, membershipId))
      .get()

    if (!existingMembership) {
      throw new Error(`Membership with id ${membershipId} not found`)
    }

    // Remove related membershipRoles
    tx.delete(schema.membershipRoles)
      .where(eq(schema.membershipRoles.membershipId, membershipId))
      .run()

    // Remove the membership
    const result = tx
      .delete(schema.memberships)
      .where(eq(schema.memberships.id, membershipId))
      .run()

    // Check if any rows were affected
    if (result.changes === 0) {
      throw new Error(`Failed to remove membership with id ${membershipId}`)
    }
  },
)
