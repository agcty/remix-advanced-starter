import { redirect } from "@remix-run/node"
import { db } from "db.server"
import { and, eq } from "drizzle-orm"
import { connections, sessions } from "schema/postgres/auth"
import { users } from "schema/postgres/multitenancy"
import { getSessionExpirationDate } from "~/utils/auth.server"
import { combineHeaders } from "~/utils/misc"
import { destroyRedirectToHeader } from "~/utils/redirect-cookie.server"
import { authSessionStorage } from "~/utils/session.server"

const destroyRedirectTo = { "set-cookie": destroyRedirectToHeader }

export async function findExistingConnection(
  providerName: string,
  providerId: string,
) {
  const existingConnection = await db.query.connections.findFirst({
    where: and(
      eq(connections.providerName, providerName),
      eq(connections.providerId, providerId),
    ),
  })
  return existingConnection
}

export async function createConnection({
  providerName,
  providerId,
  userId,
}: {
  providerName: string
  providerId: string
  userId: number
}) {
  const [connection] = await db
    .insert(connections)
    .values({
      providerName,
      providerId,
      userId,
    })
    .returning()
  return connection
}

export async function findUserByEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  return user
}

export async function createSession(userId: number) {
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      expirationDate: getSessionExpirationDate(),
    })
    .returning()
  return session
}

/**
 * Creates a new session for the user and redirects them to the given URL.
 * Sets the sessionId and expires value in the authSession cookie in any case.
 */
export async function makeSession(
  {
    request,
    userId,
    redirectTo,
  }: { request: Request; userId: number; redirectTo?: string | null },
  responseInit?: ResponseInit,
) {
  redirectTo ??= "/"
  const session = await createSession(userId)

  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  )
  authSession.set("sessionId", session.id)

  return redirect(redirectTo, {
    headers: combineHeaders(
      {
        "set-cookie": await authSessionStorage.commitSession(authSession, {
          expires: session.expirationDate,
        }),
      },
      responseInit?.headers,
      destroyRedirectTo,
    ),
  })
}
