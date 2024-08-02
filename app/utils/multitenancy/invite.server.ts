import { db } from "db.server"
import { and, eq, isNull } from "drizzle-orm"
import * as schema from "schema/multitenancy"
import {
  addRoleToMembership,
  createPendingMembership,
} from "./membership.server"

/**
 * This function invites a user to an organization. It is designed in such a way that the user has to accept the invitation before they can be associated with the organization.
 * @param param0
 * @returns
 */
export async function inviteUserToOrganization({
  email,
  organizationId,
  roleName = "MEMBER",
}: {
  email: string
  organizationId: number
  roleName?: string
}) {
  return db.transaction(async trx => {
    try {
      // Check if the organization exists
      const organization = await trx.query.organizations.findFirst({
        where: eq(schema.organizations.id, organizationId),
      })

      if (!organization) {
        throw new Error("Organization not found")
      }

      // If user doesn't exist, create a pending invitation
      const membership = createPendingMembership({
        invitedEmail: email,
        organizationId,
        tx: trx,
      })

      // Add the specified role to the membership
      addRoleToMembership({
        membershipId: membership.id,
        roleName,
        tx: trx,
      })

      console.log(`User invited to organization with ${roleName} role`)
      return membership
    } catch (error) {
      console.error("Error in inviteUserToOrganization:", error)
      throw error
    }
  })
}

export async function acceptInvitation({
  membershipId,
  userId,
}: {
  membershipId: number
  userId: number
}) {
  return db.transaction(async trx => {
    try {
      // Find the pending invitation
      const invitation = await trx.query.memberships.findFirst({
        where: and(
          eq(schema.memberships.id, membershipId),
          isNull(schema.memberships.userId),
        ),
      })

      if (!invitation) {
        throw new Error("Invitation not found or already accepted")
      }

      // Get the user
      const user = await trx.query.users.findFirst({
        where: eq(schema.users.id, userId),
      })

      if (!user) {
        throw new Error("User not found")
      }

      // Update the membership to associate it with the user and remove the invitation details.
      // Setting the userId and removing the invitedEmail and invitedName fields signifies that the user has accepted the invitation.
      const updatedMembership = await trx
        .update(schema.memberships)
        .set({
          userId,
          invitedName: null,
          invitedEmail: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.memberships.id, membershipId))
        .returning()
        .get()

      // Update the user's active organization so they see the organization they were invited to immediately
      await trx
        .update(schema.users)
        .set({
          activeOrganizationId: updatedMembership.organizationId,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId))

      console.log(`User accepted invitation to organization`)
      return updatedMembership
    } catch (error) {
      console.error("Error in acceptInvitation:", error)
      throw error
    }
  })
}

export async function listInvitations({ email }: { email: string }) {
  const invitations = await db.query.memberships.findMany({
    where: and(
      eq(schema.memberships.invitedEmail, email),
      isNull(schema.memberships.userId),
    ),
    with: {
      organization: true,
      roles: {
        with: {
          role: true,
        },
      },
    },
  })

  // Transform the result to a more user-friendly format
  return invitations.map(invitation => ({
    id: invitation.id,
    organization: {
      id: invitation.organization.id,
      name: invitation.organization.name,
    },
    roles: invitation.roles.map(role => ({
      id: role.role.id,
      name: role.role.name,
    })),
    invitedAt: invitation.createdAt,
  }))
}
