// Do not add domain specific code here. It should work for any project.

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

async function createUser({
  userData,
  activeOrganizationId,
  tx = db,
}: {
  userData: Omit<
    schema.InsertUser,
    "id" | "activeOrganizationId" | "createdAt" | "updatedAt" | "globalRole"
  >
  activeOrganizationId: number
} & TransactionParam): Promise<schema.User> {
  const [user] = await tx
    .insert(schema.users)
    .values({
      ...userData,
      activeOrganizationId,
      globalRole: "CUSTOMER",
    })
    .returning()

  return user
}

/**
 * This is the primary way of creating a new user. A new user should always be associated with an organization. This function also sets up the user as the owner of the organization.
 * @param params
 * @returns
 */
export async function createUserWithOrganization(
  params: CreateUserWithOrganizationParams,
): Promise<CreateUserWithOrganizationResult> {
  const validatedData = createUserWithOrganizationSchema.parse(params)
  const { user: userData, organizationName } = validatedData

  return db.transaction(async tx => {
    try {
      const organization = await createOrganization({
        name: organizationName,
        tx,
      })
      const user = await createUser({
        userData,
        activeOrganizationId: organization.id,
        tx,
      })
      const membership = await createMembership({
        userId: user.id,
        organizationId: organization.id,
        tx,
      })
      await addRoleToMembership({
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
