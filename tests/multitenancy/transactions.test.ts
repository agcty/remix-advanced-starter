import { db } from "db.server"
import * as schema from "schema/postgres"
import { afterEach, describe, expect, it } from "vitest"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"

const logDbState = async (message: string) => {
  const users = await db.select().from(schema.users)
  const orgs = await db.select().from(schema.organizations)
  console.log(`${message}: ${users.length} users, ${orgs.length} organizations`)
}

describe("Transaction Behavior", () => {
  afterEach(async () => {
    await logDbState("After test")
  })

  it("successfully creates a user and organization", async () => {
    const result = await createUserWithOrganization({
      user: { name: "Test User", email: "test@example.com" },
      organizationName: "Test Org",
    })

    expect(result.user).toBeDefined()
    expect(result.organization).toBeDefined()

    const users = await db.select().from(schema.users)
    const orgs = await db.select().from(schema.organizations)

    expect(users.length).toBe(1)
    expect(orgs.length).toBe(1)
  })

  it("rolls back transaction on duplicate email", async () => {
    console.log("Starting first creation")

    await createUserWithOrganization({
      user: { name: "Test User", email: "test@example.com" },
      organizationName: "Test Org 1",
    })
    await logDbState("After first creation")

    console.log("Starting second creation (should fail)")

    await expect(() =>
      createUserWithOrganization({
        user: { name: "Test User 2", email: "test@example.com" },
        organizationName: "Test Org 2",
      }),
    ).rejects.toThrowError(
      'duplicate key value violates unique constraint "mt_users_email_unique"',
    )

    await logDbState("After transaction")

    const users = await db.select().from(schema.users)
    const orgs = await db.select().from(schema.organizations)

    console.log(
      "Final state:",
      users.length,
      "users,",
      orgs.length,
      "organizations",
    )
    expect(users.length).toBe(1)
    expect(orgs.length).toBe(1)
  })

  it("verifies transaction isolation", async () => {
    const promise1 = createUserWithOrganization({
      user: { name: "User 1", email: "user1@example.com" },
      organizationName: "Org 1",
    })

    const promise2 = createUserWithOrganization({
      user: { name: "User 2", email: "user2@example.com" },
      organizationName: "Org 2",
    })

    await Promise.all([promise1, promise2])

    const users = await db.select().from(schema.users)
    const orgs = await db.select().from(schema.organizations)

    expect(users.length).toBe(2)
    expect(orgs.length).toBe(2)
  })
})
