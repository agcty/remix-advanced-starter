import { withTransaction, type WithTransactionParams } from "schema/postgres"

// Example usage:

export const removeMembership = withTransaction(
  async ({
    membershipId,
    tx,
  }: WithTransactionParams<{ membershipId: number }>): Promise<void> => {
    // Implementation here...
    console.log(`Removing membership ${membershipId} using transaction`, tx)
  },
)
