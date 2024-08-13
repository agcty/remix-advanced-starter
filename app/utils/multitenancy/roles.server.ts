// Do not add domain specific code here. It should work for any project.

import { db } from "db.server"
import { eq } from "drizzle-orm"
import { roles } from "schema/postgres"

export async function createRole({
  name,
  description,
}: {
  name: string
  description?: string
}): Promise<number> {
  const [result] = await db
    .insert(roles)
    .values({
      name,
      description: description || `Role for ${name}`,
    })
    .returning({ id: roles.id })

  return result.id
}

export async function deleteRole(roleName: string): Promise<void> {
  const role = await db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  })

  if (!role) {
    throw new Error(`Role "${roleName}" not found`)
  }

  await db.delete(roles).where(eq(roles.id, role.id))
}
