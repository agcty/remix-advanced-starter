import { db } from "db.server"
import { eq } from "drizzle-orm"
import * as schema from "schema/postgres"
import { beforeEach, describe, expect, it } from "vitest"
import { createMembership } from "~/utils/multitenancy/membership.server"
import {
  changeActiveOrganization,
  createOrganization,
} from "~/utils/multitenancy/organization.server"
import {
  createUserWithOrganization,
  type CreateUserWithOrganizationParams,
} from "~/utils/multitenancy/user.server"

describe("User", () => {
  describe("createUserWithOrganization", () => {
    it("creates a user with an organization and assigns owner role", async () => {
      const userData: CreateUserWithOrganizationParams["user"] = {
        name: "Test Doe",
        email: "test@example.com",
      }

      const organizationName = "Test Organization"

      const result = await createUserWithOrganization({
        user: userData,
        organizationName,
      })

      // Check if user was created
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(userData.email)

      // Check if organization was created
      expect(result.organization).toBeDefined()
      expect(result.organization.name).toBe(organizationName)

      // Check if membership was created
      expect(result.membership).toBeDefined()
      expect(result.membership.userId).toBe(result.user.id)
      expect(result.membership.organizationId).toBe(result.organization.id)

      // Check if user's activeOrganizationId is set correctly
      expect(result.user.activeOrganizationId).toBe(result.organization.id)

      // use helper function userHasRole instead

      // Check if OWNER role was assigned
      const ownerRole = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, "OWNER"))
        .get()
      expect(ownerRole).toBeDefined()

      const membershipRole = await db
        .select()
        .from(schema.membershipRoles)
        .where(eq(schema.membershipRoles.membershipId, result.membership.id))
        .get()
      expect(membershipRole).toBeDefined()
      expect(membershipRole?.roleId).toBe(ownerRole?.id)
    })

    it("throws an error for invalid input data", async () => {
      const invalidUserData = {
        name: "Test", // Invalid: empty name
        email: "invalid-email", // Invalid email format
      }

      expect(() =>
        createUserWithOrganization({
          user: invalidUserData,
          organizationName: "Test Org",
        }),
      ).toThrow()
    })

    it("rolls back transaction on error due to unique constraint violation", async () => {
      const userData: CreateUserWithOrganizationParams["user"] = {
        name: "Test Doe",
        email: "test@example.com",
      }

      // Force an error by trying to insert a duplicate email
      await createUserWithOrganization({
        user: userData,
        organizationName: "Test Org 1",
      })

      await expect(() =>
        createUserWithOrganization({
          user: userData, // Same email as before
          organizationName: "Test Org 2",
        }),
      ).toThrow("UNIQUE constraint failed: multitenancy_users.email")

      // Verify that the second organization was not created
      const orgs = await db.select().from(schema.organizations)
      expect(orgs.length).toBe(1)
      expect(orgs[0].name).toBe("Test Org 1")
    })

    it("handles very long names", async () => {
      const longName = "a".repeat(255) // Assuming 255 is the max length
      const userData: CreateUserWithOrganizationParams["user"] = {
        name: longName,
        email: "test@example.com",
      }

      const result = await createUserWithOrganization({
        user: userData,
        organizationName: longName,
      })

      expect(result.user.name).toBe(longName)
      expect(result.organization.name).toBe(longName)
    })

    it("handles special characters in names", async () => {
      const specialName = "Test @#$%^&*() Org"

      const result = await createUserWithOrganization({
        user: {
          name: "Test User",
          email: "special-character-test@example.com",
        },
        organizationName: specialName,
      })

      expect(result.organization.name).toBe(specialName)
    })

    it("allows duplicate organization names", async () => {
      const orgName = "Duplicate Org Name"

      const result1 = await createUserWithOrganization({
        user: { name: "User 1", email: "user1@example.com" },
        organizationName: orgName,
      })

      const newOrg = await createOrganization({ name: orgName })

      expect(result1.organization.name).toBe(orgName)
      expect(newOrg.name).toBe(orgName)
      expect(result1.organization.id).not.toBe(newOrg.id)
    })

    it("throws when calling the function twice with the same parameters", async () => {
      const user: CreateUserWithOrganizationParams["user"] = {
        name: "User 1",
        email: "user1@example.com",
      }

      await createUserWithOrganization({
        user: user,
        organizationName: "Test 1",
      })

      await expect(() =>
        createUserWithOrganization({
          user: user,
          organizationName: "Test Org 2",
        }),
      ).toThrowError("UNIQUE constraint failed: multitenancy_users.email")
    })
  })

  describe("changeActiveOrganization", () => {
    let user1: schema.User
    let org1: schema.Organization
    let org2: schema.Organization

    beforeEach(async () => {
      // Create a user with an organization
      const result = createUserWithOrganization({
        user: { name: "Test User", email: "testuser@example.com" },
        organizationName: "Test Org 1",
      })
      user1 = result.user
      org1 = result.organization

      // Create another organization
      org2 = createOrganization({ name: "Test Org 2" })
    })

    it("successfully changes active organization for a member", async () => {
      // Add user to org2
      createMembership({
        userId: user1.id,
        organizationId: org2.id,
      })

      const updatedUser = changeActiveOrganization({
        userId: user1.id,
        organizationId: org2.id,
      })

      expect(updatedUser.activeOrganizationId).toBe(org2.id)
    })

    it("throws an error when user is not a member of the organization", async () => {
      expect(() =>
        changeActiveOrganization({
          userId: user1.id,
          organizationId: org2.id,
        }),
      ).toThrow("User is not a member of the specified organization")
    })

    it("throws an error for invalid user ID", async () => {
      const invalidUserId = 9999
      expect(() =>
        changeActiveOrganization({
          userId: invalidUserId,
          organizationId: org1.id,
        }),
      ).toThrow("User is not a member of the specified organization")
    })

    it("throws an error for invalid organization ID", async () => {
      const invalidOrgId = 9999
      expect(() =>
        changeActiveOrganization({
          userId: user1.id,
          organizationId: invalidOrgId,
        }),
      ).toThrow("User is not a member of the specified organization")
    })
  })
})
