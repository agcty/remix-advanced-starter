import { db } from "db.server"
import { eq } from "drizzle-orm"
import * as schema from "schema/multitenancy"
import { describe, expect, it } from "vitest"
import {
  acceptInvitation,
  inviteUserToOrganization,
} from "~/utils/multitenancy/invite.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"

describe("Invitations", () => {
  describe("inviteUserToOrganization", () => {
    it("should create a membership with invitedEmail set and userId null", async () => {
      const { user: user1, organization: organization1 } =
        await createUserWithOrganization({
          user: { name: "Test User 1", email: "invite-test1@example.com" },
          organizationName: "Test Org 1",
        })

      const { user: user2, organization: organization2 } =
        await createUserWithOrganization({
          user: { name: "Test User 2", email: "invite-test2@example.com" },
          organizationName: "Test Org 2",
        })

      // invite user2 to organization1
      const membership = await inviteUserToOrganization({
        email: user2.email,
        organizationId: organization1.id,
        roleName: "MEMBER",
      })

      // expect a membership to have been created where invitedEmail is set and userId null
      expect(membership).toBeDefined()
      expect(membership.invitedEmail).toBe(user2.email)
      expect(membership.userId).toBeNull()
      expect(membership.organizationId).toBe(organization1.id)

      // expect the membership to have the specified role
      const membershipRole = await db.query.membershipRoles.findFirst({
        where: eq(schema.membershipRoles.membershipId, membership.id),
        with: {
          role: true,
        },
      })

      expect(membershipRole?.role.name).toBe("MEMBER")
    })

    it("should throw an error if organization doesn't exist", async () => {
      await expect(
        inviteUserToOrganization({
          email: "any-email@example.com",
          organizationId: 999,
        }),
      ).rejects.toThrowError("Organization not found")
    })
  })

  describe("acceptInvitation", () => {
    it("should successfully accept an invitation by setting [invitedEmail, invitedName] to null and populating userId", async () => {
      // create user 1
      const { user: user1, organization: organization1 } =
        await createUserWithOrganization({
          user: { name: "Test User 1", email: "invite-test1@example.com" },
          organizationName: "Test Org 1",
        })

      const { user: user2, organization: organization2 } =
        await createUserWithOrganization({
          user: { name: "Test User 2", email: "invite-test2@example.com" },
          organizationName: "Test Org 2",
        })

      // invite user2 to organization1
      const invitation = await inviteUserToOrganization({
        email: user2.email,
        organizationId: organization1.id,
      })

      // accept the invitation
      const acceptedMembership = await acceptInvitation({
        membershipId: invitation.id,
        userId: user2.id,
      })

      expect(acceptedMembership).toBeDefined()
      expect(acceptedMembership.userId).toBe(user2.id)
      expect(acceptedMembership.invitedEmail).toBeNull()
      expect(acceptedMembership.invitedName).toBeNull()
      expect(acceptedMembership.organizationId).toBe(organization1.id)

      // check that user's activeOrganizationId is updated
      const updatedUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user2.id),
      })
      expect(updatedUser?.activeOrganizationId).toBe(organization1.id)
    })

    it("should throw an error if invitation is not found", async () => {
      await expect(
        acceptInvitation({
          membershipId: 999,
          userId: 1,
        }),
      ).rejects.toThrowError("Invitation not found or already accepted")
    })

    it("should throw an error if invitation is already accepted", async () => {
      const { user: user1, organization: organization1 } =
        await createUserWithOrganization({
          user: { name: "Test User 1", email: "invite-test1@example.com" },
          organizationName: "Test Org 1",
        })

      const { user: user2, organization: organization2 } =
        await createUserWithOrganization({
          user: { name: "Test User 2", email: "invite-test2@example.com" },
          organizationName: "Test Org 2",
        })

      // invite user2 to organization1
      const invitation = await inviteUserToOrganization({
        email: user2.email,
        organizationId: organization1.id,
      })

      // accept the invitation
      await acceptInvitation({
        membershipId: invitation.id,
        userId: user2.id,
      })

      // try to accept the same invitation again
      await expect(
        acceptInvitation({
          membershipId: invitation.id,
          userId: user2.id,
        }),
      ).rejects.toThrowError("Invitation not found or already accepted")
    })

    it("should throw an error if user is not found", async () => {
      const { user: user1, organization: organization1 } =
        await createUserWithOrganization({
          user: { name: "Test User 1", email: "invite-test1@example.com" },
          organizationName: "Test Org 1",
        })

      // invite a non-existent user to organization1
      const invitation = await inviteUserToOrganization({
        email: "nonexistent@example.com",
        organizationId: organization1.id,
      })

      await expect(
        acceptInvitation({
          membershipId: invitation.id,
          userId: 999,
        }),
      ).rejects.toThrowError("User not found")
    })
  })
})
