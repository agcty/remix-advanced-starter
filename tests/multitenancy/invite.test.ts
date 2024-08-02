import { db } from "db.server"
import { eq } from "drizzle-orm"
import * as schema from "schema/multitenancy"
import { describe, expect, it } from "vitest"
import {
  acceptInvitation,
  declineInvitation,
  inviteUserToOrganization,
  listInvitations,
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

  describe("listInvitations", () => {
    it("should list all pending invitations for a given email", async () => {
      // Create a user and their organization
      const { user: user1, organization: organization1 } =
        await createUserWithOrganization({
          user: { name: "Test User 1", email: "list-invite-test1@example.com" },
          organizationName: "Test Org 1",
        })

      // Create additional organizations to invite the user to
      const { organization: organization2 } = await createUserWithOrganization({
        user: { name: "Test User 2", email: "list-invite-test2@example.com" },
        organizationName: "Test Org 2",
      })

      const { organization: organization3 } = await createUserWithOrganization({
        user: { name: "Test User 3", email: "list-invite-test3@example.com" },
        organizationName: "Test Org 3",
      })

      // Invite user1 to organization2 and organization3
      await inviteUserToOrganization({
        email: user1.email,
        organizationId: organization2.id,
        roleName: "MEMBER",
      })

      await inviteUserToOrganization({
        email: user1.email,
        organizationId: organization3.id,
        roleName: "ADMIN",
      })

      // List invitations for user1
      const invitations = await listInvitations({ email: user1.email })

      // Verify the invitations
      expect(invitations).toHaveLength(2)

      expect(invitations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            organization: expect.objectContaining({
              id: organization2.id,
              name: organization2.name,
            }),
            roles: expect.arrayContaining([
              expect.objectContaining({
                name: "MEMBER",
              }),
            ]),
          }),
          expect.objectContaining({
            organization: expect.objectContaining({
              id: organization3.id,
              name: organization3.name,
            }),
            roles: expect.arrayContaining([
              expect.objectContaining({
                name: "ADMIN",
              }),
            ]),
          }),
        ]),
      )

      // Verify each invitation has an id and invitedAt date
      invitations.forEach(invitation => {
        expect(invitation.id).toBeDefined()
        expect(invitation.invitedAt).toBeInstanceOf(Date)
      })
    })

    it("should return an empty array when there are no invitations", async () => {
      const noInvitationsEmail = "no-invitations@example.com"
      const invitations = await listInvitations({ email: noInvitationsEmail })

      expect(invitations).toEqual([])
    })
  })

  describe("declineInvitation", () => {
    it("should successfully decline an invitation by removing the membership record", async () => {
      // Create a user and their organization
      const { user: user1, organization: organization1 } =
        await createUserWithOrganization({
          user: {
            name: "Decline Test User 1",
            email: "decline-test1@example.com",
          },
          organizationName: "Decline Test Org 1",
        })

      // Create another organization to invite the user to
      const { organization: organization2 } = await createUserWithOrganization({
        user: {
          name: "Decline Test User 2",
          email: "decline-test2@example.com",
        },
        organizationName: "Decline Test Org 2",
      })

      // Invite user1 to organization2
      const invitation = await inviteUserToOrganization({
        email: user1.email,
        organizationId: organization2.id,
        roleName: "MEMBER",
      })

      // Decline the invitation
      const declinedInvitationId = await declineInvitation({
        membershipId: invitation.id,
      })

      // Verify the invitation has been declined
      expect(declinedInvitationId).toBe(invitation.id)

      // Try to fetch the declined invitation
      const declinedInvitation = await db.query.memberships.findFirst({
        where: eq(schema.memberships.id, invitation.id),
      })

      // Expect the invitation to no longer exist
      expect(declinedInvitation).toBeUndefined()
    })

    it("should throw an error if invitation is not found", async () => {
      await expect(
        declineInvitation({
          membershipId: 999,
        }),
      ).rejects.toThrowError("Invitation not found or already accepted")
    })

    it("should throw an error if invitation is already accepted", async () => {
      // Create a user and their organization
      const { user: user1, organization: organization1 } =
        await createUserWithOrganization({
          user: {
            name: "Decline Test User 3",
            email: "decline-test3@example.com",
          },
          organizationName: "Decline Test Org 3",
        })

      // Create another organization to invite the user to
      const { organization: organization2 } = await createUserWithOrganization({
        user: {
          name: "Decline Test User 4",
          email: "decline-test4@example.com",
        },
        organizationName: "Decline Test Org 4",
      })

      // Invite user1 to organization2
      const invitation = await inviteUserToOrganization({
        email: user1.email,
        organizationId: organization2.id,
        roleName: "MEMBER",
      })

      // Accept the invitation
      await acceptInvitation({
        membershipId: invitation.id,
        userId: user1.id,
      })

      // Try to decline the already accepted invitation
      await expect(
        declineInvitation({
          membershipId: invitation.id,
        }),
      ).rejects.toThrowError("Invitation not found or already accepted")
    })
  })
})
