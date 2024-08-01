import { db } from "db.server"
import { eq } from "drizzle-orm"
import * as schema from "schema/multitenancy"
import { z } from "zod"

const createUserWithOrganizationSchema = z.object({
  user: schema.insertUserSchema.omit({
    id: true,
    activeOrganizationId: true,
    createdAt: true,
    updatedAt: true,
    globalRole: true,
  }),
  organizationName: z.string().min(1),
})

export type CreateUserWithOrganizationParams = z.infer<
  typeof createUserWithOrganizationSchema
>

type CreateUserWithOrganizationResult = {
  user: typeof schema.users.$inferSelect
  organization: typeof schema.organizations.$inferSelect
  membership: typeof schema.memberships.$inferSelect
}

export function createUserWithOrganization(
  params: CreateUserWithOrganizationParams,
): CreateUserWithOrganizationResult {
  const validatedData = createUserWithOrganizationSchema.parse(params)
  const { user: userData, organizationName } = validatedData

  return db.transaction(tx => {
    try {
      // Create organization first so we can use its ID for the user
      const organization = tx
        .insert(schema.organizations)
        .values({ name: organizationName })
        .returning()
        .get()

      // Create user with the active organization ID already set
      const user = tx
        .insert(schema.users)
        .values({
          ...userData,
          activeOrganizationId: organization.id,
          // Assume all users created this way are customers for security reasons
          globalRole: "CUSTOMER",
        })
        .returning()
        .get()

      // Create the membership that links the user to the organization
      const membership = tx
        .insert(schema.memberships)
        .values({
          organizationId: organization.id,
          userId: user.id,
        })
        .returning()
        .get()

      // Get the "OWNER" role (assume it exists from seeding)
      const ownerRole = tx
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, "OWNER"))
        .get()

      if (!ownerRole) {
        throw new Error(
          "OWNER role not found. Please ensure the database is properly seeded.",
        )
      }

      // Add the owner role to the user's membership
      tx.insert(schema.membershipRoles)
        .values({
          membershipId: membership.id,
          roleId: ownerRole.id,
        })
        .run()

      return { user, organization, membership }
    } catch (error) {
      console.error("Error creating user with organization:", error)
      throw error
    }
  })
}
