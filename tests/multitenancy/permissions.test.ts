import type * as schema from "schema/postgres"
import { beforeEach, describe, expect, it } from "vitest"
import { addRoleToMembership } from "~/utils/multitenancy/membership.server"
import {
  type PermissionString,
  userHasPermission,
  userHasRole,
} from "~/utils/multitenancy/permissions.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"

describe("User Permissions and Roles", () => {
  let user: schema.User
  let organization: schema.Organization
  let membership: schema.Membership

  beforeEach(async () => {
    // Create a user with an organization before each test
    const result = await createUserWithOrganization({
      user: {
        name: "Test User",
        email: "test@example.com",
      },
      organizationName: "Test Org",
    })
    user = result.user
    organization = result.organization
    membership = result.membership
  })

  describe("userHasPermission", () => {
    it("should return true when user has the specified permission", async () => {
      // Add the ADMIN role to the user's membership
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      })

      const hasPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "read:user:own" as PermissionString,
      })

      expect(hasPermission).toBe(true)
    })

    it("should return false when user doesn't have the specified permission", async () => {
      // The user doesn't have any roles yet
      const hasPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "delete:entitythatdoesntexist" as PermissionString,
      })

      expect(hasPermission).toBe(false)
    })

    it("should handle permissions with access levels correctly", async () => {
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      })

      const hasOwnPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "create:user:any" as PermissionString,
      })

      const hasAnyPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "read:user:own" as PermissionString,
      })

      const hasMembershipPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "update:membership:any" as PermissionString,
      })

      expect(hasOwnPermission).toBe(true)
      expect(hasAnyPermission).toBe(true) // Assuming ADMIN has 'any' access
      expect(hasMembershipPermission).toBe(true) // Assuming ADMIN has 'any' access
    })
  })

  describe("userHasRole", () => {
    it("should return true when user has the specified role", async () => {
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      })

      const hasRole = await userHasRole({
        userId: user.id,
        organizationId: organization.id,
        roleName: "ADMIN",
      })

      expect(hasRole).toBe(true)
    })

    it("should return false when user doesn't have the specified role", async () => {
      // The user doesn't have any roles yet
      const hasRole = await userHasRole({
        userId: user.id,
        organizationId: organization.id,
        roleName: "ADMIN",
      })

      expect(hasRole).toBe(false)
    })
  })

  describe("Edge cases", () => {
    it("should handle non-existent users", async () => {
      const hasPermission = await userHasPermission({
        userId: 999999, // Non-existent user ID
        organizationId: organization.id,
        permissionString: "read:user" as PermissionString,
      })

      expect(hasPermission).toBe(false)
    })

    it("should handle non-existent organizations", async () => {
      const hasRole = await userHasRole({
        userId: user.id,
        organizationId: 999999, // Non-existent organization ID
        roleName: "ADMIN",
      })

      expect(hasRole).toBe(false)
    })

    it("should handle non-existent permissions", async () => {
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      })

      const hasPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "read:spaceship" as PermissionString, // Non-existent permission
      })

      expect(hasPermission).toBe(false)
    })

    it("should handle non-existent roles", async () => {
      const hasRole = await userHasRole({
        userId: user.id,
        organizationId: organization.id,
        roleName: "SUPERHERO", // Non-existent role
      })

      expect(hasRole).toBe(false)
    })
  })
})
