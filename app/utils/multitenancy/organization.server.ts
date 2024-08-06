import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import * as schema from "schema/postgres"
import { type TransactionParam } from "schema/types"

export async function createOrganization({
  name,
  tx = db,
}: { name: string } & TransactionParam): Promise<schema.Organization> {
  // PostgreSQL supports returning all columns easily, so we can simplify this

  const [organization] = await tx
    .insert(schema.organizations)
    .values({ name })
    .returning()

  return organization
}

// change active organization, this is a helper function to change the active organization of a user, it throws when the user is not a member of the organization

export async function changeActiveOrganization({
  userId,
  organizationId,
  tx = db,
}: {
  userId: number
  organizationId: number
} & TransactionParam): Promise<schema.User> {
  // It can happen that a transaction is already passed in the tx parameter so the below transaction will be a nested transaction
  return await tx.transaction(async trx => {
    // Check if the user is a member of the organization
    const [membership] = await trx
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, userId),
          eq(schema.memberships.organizationId, organizationId),
        ),
      )
      .limit(1)

    if (!membership) {
      throw new Error("User is not a member of the specified organization")
    }

    // Update the user's activeOrganizationId
    const [updatedUser] = await trx
      .update(schema.users)
      .set({ activeOrganizationId: organizationId })
      .where(eq(schema.users.id, userId))
      .returning()

    if (!updatedUser) {
      throw new Error("Failed to update user's active organization")
    }

    return updatedUser
  })
}
