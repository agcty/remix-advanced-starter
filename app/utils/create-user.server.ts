import * as schema from "schema/multitenancy"
import { z } from "zod"
import { db } from "./db.server"

const createUserWithOrganizationSchema = z.object({
  user: schema.insertUserSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  organizationName: z.string().min(1),
})

type CreateUserWithOrganizationParams = z.infer<
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
      // Create user
      const user = tx.insert(schema.users).values(userData).returning().get()

      // Create organization
      const organization = tx
        .insert(schema.organizations)
        .values({ name: organizationName })
        .returning()
        .get()

      // Create membership
      const membership = tx
        .insert(schema.memberships)
        .values({
          role: schema.MembershipRole.OWNER,
          organizationId: organization.id,
          userId: user.id,
        })
        .returning()
        .get()

      return { user, organization, membership }
    } catch (error) {
      console.error("Error creating user with organization:", error)
      throw error
    }
  })
}
