import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  addRoleToMembership,
  removeRoleFromMembership,
} from "~/utils/multitenancy/membership.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"
import * as schema from "../../schema/multitenancy"

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
