import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { db } from "db.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const orgs = await db.query.organizations.findMany()
  const users = await db.query.users.findMany()
  const sessions = await db.query.sessions.findMany()
  const connections = await db.query.connections.findMany()

  return json({
    orgs,
    users,
    sessions,
    connections,
  })
}
