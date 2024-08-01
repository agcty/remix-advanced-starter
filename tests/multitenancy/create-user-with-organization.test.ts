import { db } from "db.server"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  createUserWithOrganization,
  type CreateUserWithOrganizationParams,
} from "~/utils/create-user.server"
import * as schema from "../../schema/multitenancy"

describe("createUserWithOrganization", () => {
  it("should create a user with an organization and assign owner role", async () => {
    const userData: CreateUserWithOrganizationParams["user"] = {
      name: "Test Doe",
      email: "test@example.com",
    }

    const organizationName = "Test Organization"

    const result = await createUserWithOrganization({
      user: userData,
      organizationName,
    })

    // Check if user was created
    expect(result.user).toBeDefined()
    expect(result.user.email).toBe(userData.email)

    // Check if organization was created
    expect(result.organization).toBeDefined()
    expect(result.organization.name).toBe(organizationName)

    // Check if membership was created
    expect(result.membership).toBeDefined()
    expect(result.membership.userId).toBe(result.user.id)
    expect(result.membership.organizationId).toBe(result.organization.id)

    // Check if user's activeOrganizationId is set correctly
    expect(result.user.activeOrganizationId).toBe(result.organization.id)

    // Check if OWNER role was assigned
    const ownerRole = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, "OWNER"))
      .get()
    expect(ownerRole).toBeDefined()

    const membershipRole = await db
      .select()
      .from(schema.membershipRoles)
      .where(eq(schema.membershipRoles.membershipId, result.membership.id))
      .get()
    expect(membershipRole).toBeDefined()
    expect(membershipRole?.roleId).toBe(ownerRole?.id)
  })

  it("should allow a user to be part of multiple organizations", async () => {
    const user = await createUserWithOrganization({
      user: {
        name: "Multi Org User",
        email: "multiorg@example.com",
      },
      organizationName: "First Org",
    })

    const secondOrg = await db
      .insert(schema.organizations)
      .values({
        name: "Second Org",
      })
      .returning()
      .get()

    const secondMembership = await db
      .insert(schema.memberships)
      .values({
        organizationId: secondOrg.id,
        userId: user.user.id,
      })
      .returning()
      .get()

    const userMemberships = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, user.user.id))

    expect(userMemberships.length).toBe(2)
  })

  it("should assign correct permissions to roles", async () => {
    const user = await createUserWithOrganization({
      user: {
        name: "Role Test User",
        email: "roletest@example.com",
      },
      organizationName: "Role Test Org",
    })

    const ownerRole = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, "OWNER"))
      .get()

    const createPermission = await db
      .insert(schema.permissions)
      .values({
        action: "create",
        entity: "post",
        access: "any",
      })
      .returning()
      .get()

    await db.insert(schema.rolePermissions).values({
      roleId: ownerRole!.id,
      permissionId: createPermission.id,
    })

    const rolePermissions = await db
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, ownerRole!.id))

    expect(rolePermissions.length).toBeGreaterThan(0)
  })

  it("should allow duplicate organization names", async () => {
    const orgName = "Org with same name"
    const { organization: org1 } = await createUserWithOrganization({
      user: {
        name: "Unique User 1",
        email: "unique1@example.com",
      },
      organizationName: orgName,
    })

    const { organization: org2 } = await createUserWithOrganization({
      user: {
        name: "Unique User 1",
        email: "unique2@example.com",
      },
      organizationName: orgName,
    })

    expect(org1.name).toBe(orgName)
    expect(org2.name).toBe(orgName)
    expect(org1.name).toBe(org2.name)
    expect(org1.id).not.toBe(org2.id)
  })

  it("should create a membership invitation", async () => {
    const org = await db
      .insert(schema.organizations)
      .values({
        name: "Invite Org",
      })
      .returning()
      .get()

    const invitation = await db
      .insert(schema.memberships)
      .values({
        organizationId: org.id,
        invitedEmail: "invited@example.com",
        invitedName: "Invited User",
      })
      .returning()
      .get()

    expect(invitation.invitedEmail).toBe("invited@example.com")
    expect(invitation.userId).toBeNull()
  })

  it("should update a user's active organization", async () => {
    const user = await createUserWithOrganization({
      user: {
        name: "Active Org User",
        email: "activeorg@example.com",
      },
      organizationName: "Active Org 1",
    })

    const newOrg = await db
      .insert(schema.organizations)
      .values({
        name: "Active Org 2",
      })
      .returning()
      .get()

    await db.insert(schema.memberships).values({
      organizationId: newOrg.id,
      userId: user.user.id,
    })

    await db
      .update(schema.users)
      .set({ activeOrganizationId: newOrg.id })
      .where(eq(schema.users.id, user.user.id))

    const updatedUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.user.id))
      .get()

    expect(updatedUser!.activeOrganizationId).toBe(newOrg.id)
  })
})
