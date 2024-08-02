import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  addRoleToMembership,
  createMembership,
} from "~/utils/multitenancy/membership.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"
import * as schema from "../../schema/multitenancy"

describe("Memberships and Roles", () => {
  it("should allow only one membership per user for a given organization", async () => {
    const { user, organization } = await createUserWithOrganization({
      user: {
        name: "John Doe",
        email: "john@example.com",
      },
      organizationName: "Test Org",
    })

    // Attempt to create a second membership for the same user and organization
    await expect(
      createMembership({
        userId: user.id,
        organizationId: organization.id,
      }),
    ).rejects.toThrow() // This should throw an error due to uniqueness constraint

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

  it("should allow multiple roles for a single membership", async () => {
    const { membership } = await createUserWithOrganization({
      user: {
        name: "Jane Doe",
        email: "jane@example.com",
      },
      organizationName: "Another Org",
    })

    // Add multiple roles to the membership
    await addRoleToMembership({
      membershipId: membership.id,
      roleName: "ADMIN",
    })

    await addRoleToMembership({
      membershipId: membership.id,
      roleName: "MEMBER",
    })

    // Verify that both roles are associated with the membership
    const membershipRoles = await db.query.membershipRoles.findMany({
      where: eq(schema.membershipRoles.membershipId, membership.id),
      with: {
        role: true,
      },
    })

    expect(membershipRoles.length).toBe(2)
    expect(membershipRoles.map(mr => mr.role.name)).toContain("ADMIN")
    expect(membershipRoles.map(mr => mr.role.name)).toContain("MEMBER")
  })

  it("should not allow duplicate roles for a single membership", async () => {
    const { membership } = await createUserWithOrganization({
      user: {
        name: "Bob Smith",
        email: "bob@example.com",
      },
      organizationName: "Yet Another Org",
    })

    // Add a role to the membership
    await addRoleToMembership({
      membershipId: membership.id,
      roleName: "ADMIN",
    })

    // Attempt to add the same role again
    await expect(
      addRoleToMembership({
        membershipId: membership.id,
        roleName: "ADMIN",
      }),
    ).rejects.toThrow() // This should throw an error due to uniqueness constraint

    // Verify that only one role association exists
    const membershipRoles = await db.query.membershipRoles.findMany({
      where: eq(schema.membershipRoles.membershipId, membership.id),
      with: {
        role: true,
      },
    })

    expect(membershipRoles.length).toBe(1)
    expect(membershipRoles[0].role.name).toBe("VIEWER")
  })
})
