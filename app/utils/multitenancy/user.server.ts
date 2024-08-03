import { invariant } from "@epic-web/invariant"
import { db } from "db.server"
import * as schema from "schema/multitenancy"
import {
  type TransactionParam,
  withTransaction,
  type WithTransactionParams,
} from "schema/types"
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

export const createUser = withTransaction(
  async ({
    userData,
    activeOrganizationId,
    tx,
  }: WithTransactionParams<{
    userData: Omit<
      schema.InsertUser,
      "id" | "activeOrganizationId" | "createdAt" | "updatedAt" | "globalRole"
    >
    activeOrganizationId: number
  }>): Promise<schema.User> => {
    return tx
      .insert(schema.users)
      .values({
        ...userData,
        activeOrganizationId,
        globalRole: "CUSTOMER",
      })
      .returning()
      .get()
  },
)

/**
 * This is the primary way of creating a new user. A new user should always be associated with an organization. This function also sets up the user as the owner of the organization.
 * @param params
 * @returns
 */
export const createUserWithOrganization = withTransaction(
  async ({
    tx: tx2,
    ...params
  }: WithTransactionParams<CreateUserWithOrganizationParams>): Promise<CreateUserWithOrganizationResult> => {
    const validatedData = createUserWithOrganizationSchema.parse(params)
    const { user: userData, organizationName } = validatedData

    try {
      db.transaction(async tx => {
        const organization = await createOrganization({
          name: organizationName,
          tx,
        })
        const user = await createUser({
          userData,
          activeOrganizationId: organization.id,
          tx,
        })
        console.log({ userId: user.id })

        const membership = await createMembership({
          userId: user.id,
          organizationId: organization.id,
          tx,
        })
        const shouldThrow = true
        if (shouldThrow) {
          throw new Error("Test error")
        }
        await addRoleToMembership({
          membershipId: membership.id,
          roleName: "OWNER",
          tx,
        })

        return { user, organization, membership }
      })
    } catch (error) {
      console.error("Error creating user with organization:", error)
      throw error
    }
  },
)
