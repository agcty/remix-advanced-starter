import { db } from "db.server"
import { eq } from "drizzle-orm"
import * as schema from "schema/postgres"
import { describe, expect, it } from "vitest"
import {
  addPermissionToRole,
  createPermission,
} from "~/utils/multitenancy/permissions.server"
import { createRole } from "~/utils/multitenancy/roles.server" // Adjust the import path as necessary

describe("Role and Permission Helpers", () => {
  describe("createRole", () => {
    it("should create a new role", async () => {
      const roleName = "TEST_ROLE"
      const roleDescription = "Test role description"

      const roleId = await createRole({
        name: roleName,
        description: roleDescription,
      })

      const [createdRole] = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.id, roleId))

      expect(createdRole).toBeDefined()
      expect(createdRole!.name).toBe(roleName)
      expect(createdRole!.description).toBe(roleDescription)
    })

    it("should not allow duplicate role names", async () => {
      const roleName = "UNIQUE_ROLE"

      await createRole({ name: roleName })

      await expect(() => createRole({ name: roleName })).rejects.toThrow(
        /duplicate key value violates unique constraint/,
      )
    })
  })

  describe("createPermission", () => {
    it("should create a new permission", async () => {
      const entity = "test_entity"
      const action = "read"
      const access = "own"

      const permissionId = await createPermission({ entity, action, access })

      const [createdPermission] = await db
        .select()
        .from(schema.permissions)
        .where(eq(schema.permissions.id, permissionId))

      expect(createdPermission).toBeDefined()
      expect(createdPermission!.entity).toBe(entity)
      expect(createdPermission!.action).toBe(action)
      expect(createdPermission!.access).toBe(access)
      expect(createdPermission!.description).toBe(
        `${action} ${access} ${entity}`,
      )
    })

    it("should not allow duplicate permissions", async () => {
      const permissionData: schema.InsertPermission = {
        entity: "unique_entity",
        action: "create",
        access: "any",
      }

      await createPermission(permissionData)

      await expect(() => createPermission(permissionData)).rejects.toThrow(
        /duplicate key value violates unique constraint/,
      )
    })
  })

  describe("addPermissionToRole", () => {
    it("should add a permission to a role", async () => {
      const roleName = "TEST_ROLE_WITH_PERMISSION"
      const roleId = await createRole({ name: roleName })

      const permissionData: schema.InsertPermission = {
        entity: "test_entity",
        action: "update",
        access: "any",
      }
      const permissionId = await createPermission(permissionData)

      await addPermissionToRole({ roleName, permissionId })

      const rolePermissions = await db.query.rolePermissions.findMany({
        where: eq(schema.rolePermissions.roleId, roleId),
        with: {
          permission: true,
        },
      })

      expect(rolePermissions.length).toBe(1)
      expect(rolePermissions[0].permissionId).toBe(permissionId)
      expect(rolePermissions[0].permission.entity).toBe(permissionData.entity)
      expect(rolePermissions[0].permission.action).toBe(permissionData.action)
      expect(rolePermissions[0].permission.access).toBe(permissionData.access)
    })

    it("should not allow adding the same permission to a role twice", async () => {
      const roleName = "ROLE_WITH_UNIQUE_PERMISSION"
      await createRole({ name: roleName })

      const permissionId = await createPermission({
        entity: "unique_entity",
        action: "read",
        access: "any",
      })

      await addPermissionToRole({ roleName, permissionId })

      await expect(() =>
        addPermissionToRole({ roleName, permissionId }),
      ).rejects.toThrow(/duplicate key value violates unique constraint/)
    })

    it("should throw an error when adding a permission to a non-existent role", async () => {
      const nonExistentRoleName = "NON_EXISTENT_ROLE"
      const permissionId = await createPermission({
        entity: "test_entity",
        action: "delete",
        access: "any",
      })

      await expect(() =>
        addPermissionToRole({ roleName: nonExistentRoleName, permissionId }),
      ).rejects.toThrow(`Role "${nonExistentRoleName}" not found`)
    })
  })
})
