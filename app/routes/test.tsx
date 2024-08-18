import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { db } from "db.server"
import { requireUserId } from "~/utils/auth.server"
import {
  requireUserWithPermission,
  requireUserWithRole,
} from "~/utils/multitenancy/permissions.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"
import { redirectWithToast } from "~/utils/toast.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const orgs = await db.query.organizations.findMany()
  const users = await db.query.users.findMany()
  const sessions = await db.query.sessions.findMany()
  const connections = await db.query.connections.findMany()

  // await createUserWithOrganization({
  //   organizationName: "Gogl",
  //   user: {
  //     email: "alex@gogl.io",
  //     name: "Alex",
  //   },
  // })

  return json({
    orgs,
    users,
    sessions,
    connections,
  })
}
