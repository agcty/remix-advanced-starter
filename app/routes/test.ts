import { json } from "@remix-run/node"
import { db } from "db.server"
import { eq, sql } from "drizzle-orm"
import { memberships, organizations, users } from "schema/postgres"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"

export async function loader() {
  const orgName = "Test Org Invite"
  const userName = "Test User"
  const userEmail = "test@example.com"

  try {
    db.transaction(tx => {
      // Create a new organization
      const [newOrg] = tx
        .insert(organizations)
        .values({ name: orgName })
        .returning()

      // Create a new user
      const [newUser] = tx
        .insert(users)
        .values({
          name: userName,
          email: userEmail,
          activeOrganizationId: newOrg.id,
        })
        .returning()

      // Create a membership
      tx.insert(memberships).values({
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
    .select()
    .from(organizations)
    .where(eq(organizations.name, orgName))

  const userCount = await db
    .select({ count: sql`count(*)` })
    .from(users)
    .where(eq(users.email, userEmail))

  return json(
    { orgCount, userCount },
    // { headers: { "Server-Timing": timings.toString() } }, // <-- 3. Create headers
  )

  // return redirectWithToast("/", { description: "test" })
}
