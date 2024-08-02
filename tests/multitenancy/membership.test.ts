import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  addRoleToMembership,
  createMembership,
  removeRoleFromMembership,
} from "~/utils/multitenancy/membership.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"
import * as schema from "../../schema/multitenancy"

describe("Memberships and Roles", () => {
  describe("createMembership", () => {
    it("should allow only one membership per user for a given organization", async () => {
      const { user, organization } = await createUserWithOrganization({
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
        organizationName: "Test Org",
      })

      // Attempt to create a second membership for the same user and organization
      expect(() =>
        createMembership({
          userId: user.id,
          organizationId: organization.id,
        }),
      ).toThrowError(
        "UNIQUE constraint failed: multitenancy_memberships.user_id, multitenancy_memberships.organization_id",
      )

      // Verify that only one membership exists
      const memberships = await db
        .select()
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.userId, user.id),
            eq(schema.memberships.organizationId, organization.id),
          ),
        )
        .all()

      expect(memberships.length).toBe(1)
    })
  })

  describe("addRoleToMembership", () => {
    it("should not allow duplicate roles for a single membership", async () => {
      // at this point the user has a membership with a role of "OWNER"
      const { membership } = await createUserWithOrganization({
        user: {
          name: "Bob Smith",
          email: "bob@example.com",
        },
        organizationName: "Yet Another Org",
      })

      // Attempt to add the same role again
      expect(() =>
        addRoleToMembership({
          membershipId: membership.id,
          roleName: "OWNER",
        }),
      ).toThrow(
        "UNIQUE constraint failed: multitenancy_membership_roles.membership_id, multitenancy_membership_roles.role_id",
      ) // This should throw an error due to uniqueness constraint

      const membershipRoles = await db.query.membershipRoles.findMany({
        where: eq(schema.membershipRoles.membershipId, membership.id),
        with: {
          role: true,
        },
      })

      // Verify that only one role association exists
      expect(membershipRoles.length).toBe(1)
      expect(membershipRoles[0].role.name).toBe("OWNER")
    })

    it("should allow different roles for a single membership", async () => {
      // at this point the user has a membership with a role of "OWNER"
      const { membership } = await createUserWithOrganization({
        user: {
          name: "Bob Smith",
          email: "bob@example.com",
        },
        organizationName: "Yet Another Org",
      })

      // Now we add the role of "ADMIN" to the membership
      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      })

      // the user now has two roles, "OWNER" and "ADMIN"
      const membershipRoles = await db.query.membershipRoles.findMany({
        where: eq(schema.membershipRoles.membershipId, membership.id),
        with: {
          role: true,
        },
      })

      expect(membershipRoles.length).toBe(2)
      expect(membershipRoles[0].role.name).toBe("OWNER")
      expect(membershipRoles[1].role.name).toBe("ADMIN")
    })
  })

  describe("removeRoleFromMembership", () => {
    it("should remove a role from a membership", async () => {
      const { membership } = await createUserWithOrganization({
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
        organizationName: "Test Org",
      })

      await addRoleToMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      })

      removeRoleFromMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      })

      const remainingRole = await db
        .select()
        .from(schema.membershipRoles)
        .where(
          and(
            eq(schema.membershipRoles.membershipId, membership.id),
            eq(
              schema.membershipRoles.roleId,
              db
                .select({ id: schema.roles.id })
                .from(schema.roles)
                .where(eq(schema.roles.name, "ADMIN")),
            ),
          ),
        )
        .get()

      expect(remainingRole).toBeUndefined()
    })

    it("should throw an error when trying to remove a non-existent role", async () => {
      const { membership } = await createUserWithOrganization({
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
        organizationName: "Test Org",
      })

      expect(() =>
        removeRoleFromMembership({
          membershipId: membership.id,
          roleName: "NON_EXISTENT_ROLE",
        }),
      ).toThrow(
        "NON_EXISTENT_ROLE role not found. Please ensure the database is properly seeded.",
      )
    })
  })
})
