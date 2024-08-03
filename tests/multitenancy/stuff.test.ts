import { db } from "db.server"
import { eq } from "drizzle-orm"
import * as schema from "schema"
import { describe, expect, it } from "vitest"
import { createMembership } from "~/utils/multitenancy/membership.server"
import { createOrganization } from "~/utils/multitenancy/organization.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"

describe("Multitenancy Transaction Tests", () => {
  let userId: number
  let organizationId: number

  //   it("should revert everything if an error happens", async () => {
  //     const shouldThrow = true

  //     // await expect(async () => {
  //     await db.transaction(async tx => {
  //       const { user } = await createUserWithOrganization({
  //         user: {
  //           name: "John Doe",
  //           email: "test@test1.com",
  //         },
  //         organizationName: "Test Org",
  //         tx,
  //       })
  //       userId = user.id

  //       const organization = await createOrganization({
  //         name: "Test Org 2",
  //         tx,
  //       })
  //       organizationId = organization.id

  //       // if (shouldThrow) {
  //       //   throw new Error("Test error")
  //       // }

  //       const membership = await createMembership({
  //         userId: user.id,
  //         organizationId: organization.id,
  //         tx,
  //       })
  //     })
  //     // }).rejects.toThrow("Test error")

  //     // Check that no user was created
  //     const user = await db
  //       .select()
  //       .from(schema.users)
  //       .where(eq(schema.users.email, "test@test1.com"))
  //       .get()
  //     expect(user).toBeUndefined()

  //     // Check that no organization was created
  //     const organization = await db
  //       .select()
  //       .from(schema.organizations)
  //       .where(eq(schema.organizations.name, "Test Org 2"))
  //       .get()
  //     expect(organization).toBeUndefined()

  //     // Check that no membership was created
  //     const membership = await db.select().from(schema.memberships).get()
  //     expect(membership).toBeUndefined()
  //   })

  it("should revert everything if an error happens", async () => {
    await createUserWithOrganization({
      user: {
        name: "John Doe",
        email: "test@test1.com",
      },
      organizationName: "Test Org",
    }).catch(() => {})

    // Check that no user was created
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "test@test1.com"))
      .get()
    expect(user).toBeUndefined()

    // Check that no organization was created
    const organization = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.name, "Test Org"))
      .get()
    expect(organization).toBeUndefined()

    // // Check that no membership was created
    // const membership = await db.select().from(schema.memberships).get()
    // expect(membership).toBeUndefined()
  })

  //   it("should commit everything if no error happens", async () => {
  //     const shouldThrow = false

  //     await db.transaction(async tx => {
  //       const { user } = await createUserWithOrganization({
  //         user: {
  //           name: "John Doe",
  //           email: "test@test1.com",
  //         },
  //         organizationName: "Test Org",
  //       })
  //       userId = user.id

  //       const organization = await createOrganization({ name: "Test Org 2", tx })
  //       organizationId = organization.id

  //       if (shouldThrow) {
  //         throw new Error("Test error")
  //       }

  //       const membership = await createMembership({
  //         userId: user.id,
  //         organizationId: organization.id,
  //         tx,
  //       })
  //     })

  //     // Check that the user was created
  //     const user = await db
  //       .select()
  //       .from(schema.users)
  //       .where(eq(schema.users.email, "test@test1.com"))
  //       .get()
  //     expect(user).toBeDefined()
  //     expect(user?.name).toBe("John Doe")

  //     // Check that both organizations were created
  //     const organizations = await db.select().from(schema.organizations).all()
  //     expect(organizations).toHaveLength(2)
  //     expect(organizations[0].name).toBe("Test Org")
  //     expect(organizations[1].name).toBe("Test Org 2")

  //     // Check that the membership was created
  //     const membership = await db.select().from(schema.memberships).get()
  //     expect(membership).toBeDefined()
  //     expect(membership?.userId).toBe(userId)
  //     expect(membership?.organizationId).toBe(organizationId)
  //   })
})
