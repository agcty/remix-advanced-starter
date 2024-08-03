import { db } from "db.server"
import { eq, sql } from "drizzle-orm"
import { memberships, organizations, users } from "schema"
import { describe, expect, it } from "vitest"

describe("Multitenancy Transaction Tests", () => {
  it("should revert everything if an error happens", async () => {
    const orgName = "Test Org Invite"
    const userName = "Test User"
    const userEmail = "test@example.com"

    try {
      await db.transaction(async tx => {
        // Create a new organization
        const [newOrg] = await tx
          .insert(organizations)
          .values({ name: orgName })
          .returning()

        // Create a new user
        const [newUser] = await tx
          .insert(users)
          .values({
            name: userName,
            email: userEmail,
            activeOrganizationId: newOrg.id,
          })
          .returning()

        // Create a membership
        await tx.insert(memberships).values({
          organizationId: newOrg.id,
          userId: newUser.id,
        })

        // Intentionally cause an error
        throw new Error("Simulated error")
      })
    } catch (error) {
      // Transaction should have been rolled back
      console.error("Error occurred:", error)
    }

    // Verify that no data was persisted
    const orgCount = await db
      .select({ count: sql`count(*)` })
      .from(organizations)
      .where(eq(organizations.name, orgName))

    const userCount = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.email, userEmail))

    expect(orgCount[0].count).toBe(0)
    expect(userCount[0].count).toBe(0)
  })
})
