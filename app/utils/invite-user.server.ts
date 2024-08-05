import { db } from "db.server"
import { eq } from "drizzle-orm"
import { membershipRoles, memberships, roles, users } from "schema/postgres"

export async function inviteUserToOrganization(
  organizationId: number,
  email: string,
  invitedName?: string,
) {
  return await db.transaction(async tx => {
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const [membership] = await tx
      .insert(memberships)
      .values({
        organizationId,
        userId: existingUser?.id,
        invitedEmail: email,
        invitedName,
      })
      .returning()

    const [memberRole] = await tx
      .select()
      .from(roles)
      .where(eq(roles.name, "MEMBER"))

    await tx.insert(membershipRoles).values({
      membershipId: membership.id,
      roleId: memberRole.id,
    })

    return membership
  })
}
