import { db } from "db.server"
import { type DbFunctionParams, wrapDbFunction } from "schema"

// Example usage:

export const removeMembership = wrapDbFunction(
  async ({
    membershipId,
    tx,
  }: DbFunctionParams<{ membershipId: number }>): Promise<void> => {
    // Implementation here...
    console.log(`Removing membership ${membershipId} using transaction`, tx)
  },
)
