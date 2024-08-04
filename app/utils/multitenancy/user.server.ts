import { db } from "db.server"
import * as schema from "schema/postgres"
import { type TransactionParam } from "schema/types"
import { z } from "zod"
import { addRoleToMembership, createMembership } from "./membership.server"
import { createOrganization } from "./organization.server"

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
  user: schema.User
  organization: schema.Organization
  membership: schema.Membership
}

function createUser({
  userData,
  activeOrganizationId,
  tx = db,
}: {
  userData: Omit<
    schema.InsertUser,
    "id" | "activeOrganizationId" | "createdAt" | "updatedAt" | "globalRole"
  >
  activeOrganizationId: number
} & TransactionParam): schema.User {
  return tx
    .insert(schema.users)
    .values({
      ...userData,
      activeOrganizationId,
      globalRole: "CUSTOMER",
    })
    .returning()
    .get()
}

/**
 * This is the primary way of creating a new user. A new user should always be associated with an organization. This function also sets up the user as the owner of the organization.
 * @param params
 * @returns
 */
export function createUserWithOrganization(
  params: CreateUserWithOrganizationParams,
): CreateUserWithOrganizationResult {
  const validatedData = createUserWithOrganizationSchema.parse(params)
  const { user: userData, organizationName } = validatedData

  return db.transaction(tx => {
    try {
      const organization = createOrganization({ name: organizationName, tx })
      const user = createUser({
        userData,
        activeOrganizationId: organization.id,
        tx,
      })
      const membership = createMembership({
        userId: user.id,
        organizationId: organization.id,
        tx,
      })
      addRoleToMembership({
        membershipId: membership.id,
        roleName: "OWNER",
        tx,
      })

      return { user, organization, membership }
    } catch (error) {
      console.error("Error creating user with organization:", error)
      throw error
    }
  })
}
