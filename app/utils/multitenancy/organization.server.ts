import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import * as schema from "schema/multitenancy"
import { type TransactionParam } from "schema/types"

export function createOrganization({
  name,
  tx = db,
}: { name: string } & TransactionParam): schema.Organization {
  return tx.insert(schema.organizations).values({ name }).returning().get()
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
  return await tx.transaction(async tx2 => {
    // Check if the user is a member of the organization
    const membership = await tx2
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, userId),
          eq(schema.memberships.organizationId, organizationId),
        ),
      )
      .get()

    if (!membership) {
      throw new Error("User is not a member of the specified organization")
    }

    // Update the user's activeOrganizationId
    const updatedUser = await tx2
      .update(schema.users)
      .set({ activeOrganizationId: organizationId })
      .where(eq(schema.users.id, userId))
      .returning()
      .get()

    if (!updatedUser) {
      throw new Error("Failed to update user's active organization")
    }

    return updatedUser
  })
}
