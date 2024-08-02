import { db } from "db.server"
import * as schema from "schema/multitenancy"
import { type TransactionParam } from "../../../schema/types"

export function createOrganization({
  name,
  tx = db,
}: { name: string } & TransactionParam): schema.Organization {
  return tx.insert(schema.organizations).values({ name }).returning().get()
}

// change active organization, this is a helper function to change the active organization of a user, it throws when the user is not a member of the organization
