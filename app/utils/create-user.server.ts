import {
  GlobalRole,
  MembershipRole,
  memberships,
  organizations,
  users,
} from "schema/users"
import { db } from "./db.server"

export async function createUserWithOrganization({
  name,
  email,
  organizationName,
}: {
  name: string
  email: string
  organizationName: string
}) {
  return await db.transaction(async tx => {
    const [user] = await tx
      .insert(users)
      .values({
        name,
        email,
        role: GlobalRole.CUSTOMER,
      })
      .returning()

    const [organization] = await tx
      .insert(organizations)
      .values({
        name: organizationName,
      })
      .returning()

    await tx.insert(memberships).values({
      role: MembershipRole.OWNER,
      organizationId: organization.id,
      userId: user.id,
    })

    return user
  })
}
