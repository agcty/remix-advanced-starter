import type * as schema from "schema/postgres"
import { beforeEach, describe, expect, it } from "vitest"
import { addRoleToMembership } from "~/utils/multitenancy/membership.server"
import {
  addPermissionToRole,
  createPermission,
  deletePermission,
  type PermissionString,
  removePermissionFromRole,
  userHasPermission,
  userHasRole,
} from "~/utils/multitenancy/permissions.server"
import { createRole } from "~/utils/multitenancy/roles.server"
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

    await createRole({ name: "UNIQUE_PERMISSION_ROLE" })
  })

  describe("userHasPermission", () => {
    it("should return true when user has the specified permission", async () => {
      // Add the UNIQUE_PERMISSION_ROLE role to the user's membership
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "UNIQUE_PERMISSION_ROLE",
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
        roleName: "UNIQUE_PERMISSION_ROLE",
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
      expect(hasAnyPermission).toBe(true) // Assuming UNIQUE_PERMISSION_ROLE has 'any' access
      expect(hasMembershipPermission).toBe(true) // Assuming UNIQUE_PERMISSION_ROLE has 'any' access
    })
  })

  describe("userHasRole", () => {
    it("should return true when user has the specified role", async () => {
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "UNIQUE_PERMISSION_ROLE",
      })

      const hasRole = await userHasRole({
        userId: user.id,
        organizationId: organization.id,
        roleName: "UNIQUE_PERMISSION_ROLE",
      })

      expect(hasRole).toBe(true)
    })

    it("should return false when user doesn't have the specified role", async () => {
      // The user doesn't have any roles yet
      const hasRole = await userHasRole({
        userId: user.id,
        organizationId: organization.id,
        roleName: "UNIQUE_PERMISSION_ROLE",
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
        roleName: "UNIQUE_PERMISSION_ROLE",
      })

      expect(hasRole).toBe(false)
    })

    it("should handle non-existent permissions", async () => {
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "UNIQUE_PERMISSION_ROLE",
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

  describe("createPermission", () => {
    it("should create a new permission", async () => {
      const permissionId = await createPermission({
        entity: "uniqueperm",
        action: "create",
        access: "any",
      })

      expect(permissionId).toBeGreaterThan(0)

      const hasPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "create:uniqueperm:any" as PermissionString,
      })

      expect(hasPermission).toBe(false) // Permission created but not assigned to any role yet
    })
  })

  describe("addPermissionToRole", () => {
    it("should add a permission to a role", async () => {
      const permissionId = await createPermission({
        entity: "uniqueperm",
        action: "create",
        access: "any",
      })

      await addPermissionToRole({
        roleName: "UNIQUE_PERMISSION_ROLE",
        permissionId,
      })

      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "UNIQUE_PERMISSION_ROLE",
      })

      const hasPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "create:uniqueperm:any" as PermissionString,
      })

      expect(hasPermission).toBe(true)
    })

    it("should throw an error when adding permission to non-existent role", async () => {
      const permissionId = await createPermission({
        entity: "uniqueperm",
        action: "create",
        access: "any",
      })

      await expect(
        addPermissionToRole({
          roleName: "NON_EXISTENT_ROLE",
          permissionId,
        }),
      ).rejects.toThrow('Role "NON_EXISTENT_ROLE" not found')
    })
  })

  describe("removePermissionFromRole", () => {
    it("should remove a permission from a role", async () => {
      const permissionId = await createPermission({
        entity: "uniqueperm",
        action: "create",
        access: "any",
      })

      await addPermissionToRole({
        roleName: "UNIQUE_PERMISSION_ROLE",
        permissionId,
      })

      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "UNIQUE_PERMISSION_ROLE",
      })

      await removePermissionFromRole({
        roleName: "UNIQUE_PERMISSION_ROLE",
        permissionId,
      })

      const hasPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "create:uniqueperm:any" as PermissionString,
      })

      expect(hasPermission).toBe(false)
    })

    it("should throw an error when removing permission from non-existent role", async () => {
      await expect(
        removePermissionFromRole({
          roleName: "NON_EXISTENT_ROLE",
          permissionId: 1,
        }),
      ).rejects.toThrow('Role "NON_EXISTENT_ROLE" not found')
    })
  })

  describe("deletePermission", () => {
    it("should delete a permission", async () => {
      const permissionId = await createPermission({
        entity: "uniqueperm",
        action: "create",
        access: "any",
      })

      await deletePermission(permissionId)

      const hasPermission = await userHasPermission({
        userId: user.id,
        organizationId: organization.id,
        permissionString: "create:uniqueperm:any" as PermissionString,
      })

      expect(hasPermission).toBe(false)
    })

    it("should throw an error when deleting non-existent permission", async () => {
      await expect(deletePermission(99999)).rejects.toThrow(
        "Permission with id 99999 not found",
      )
    })
  })
})
