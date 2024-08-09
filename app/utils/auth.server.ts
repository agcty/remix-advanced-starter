import { redirect } from "@remix-run/node"
import bcrypt from "bcryptjs"
import { db } from "db.server"
import { and, eq, gt } from "drizzle-orm"
import { safeRedirect } from "remix-utils/safe-redirect"
import { connections, passwords, sessions, users } from "schema/postgres"
// import { connectionSessionStorage, providers } from "./connections.server.ts"
import { combineHeaders } from "./misc"
import { createUserWithOrganization } from "./multitenancy/user.server.js"
// import { type ProviderUser } from "./providers/provider.ts"
import { authSessionStorage } from "./session.server"

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME)

/**
 * Retrieves the userId of the current authenticated session.
 * This function performs several key steps:
 * 1. Extracts the session from the request cookies
 * 2. Checks if a valid sessionId exists
 * 3. Queries the database to verify if the session is still valid and not expired
 * 4. If the session is invalid or expired, it destroys the session and redirects
 * 5. Returns the userId if the session is valid
 */
export async function getUserId(request: Request) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  )
  const sessionId = authSession.get("sessionId")
  if (!sessionId) return null

  const session = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(
      and(eq(sessions.id, sessionId), gt(sessions.expirationDate, new Date())),
    )
    .limit(1)

  if (session.length === 0 || !session[0].userId) {
    throw redirect("/", {
      headers: {
        "set-cookie": await authSessionStorage.destroySession(authSession),
      },
    })
  }
  return session[0].userId
}

/**
 * Ensures that a user is authenticated before allowing access.
 * If not authenticated, it redirects to the login page.
 * The function also handles preserving the original request URL for redirection after login.
 */
export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {},
) {
  const userId = await getUserId(request)
  if (!userId) {
    const requestUrl = new URL(request.url)
    redirectTo =
      redirectTo === null
        ? null
        : (redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`)
    const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
    const loginRedirect = ["/login", loginParams?.toString()]
      .filter(Boolean)
      .join("?")
    throw redirect(loginRedirect)
  }
  return userId
}

/**
 * Ensures that the current request is from an unauthenticated user.
 * If a user is already authenticated, it redirects them to the home page.
 * This is useful for pages that should only be accessed by non-logged-in users.
 */
export async function requireAnonymous(request: Request) {
  const userId = await getUserId(request)
  if (userId) {
    throw redirect("/")
  }
}

export async function login({
  username,
  password,
}: {
  username: string
  password: string
}) {
  const user = await verifyUserPassword({ username }, password)
  if (!user) return null
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      expirationDate: getSessionExpirationDate(),
    })
    .returning()
  return session
}

export async function resetUserPassword({
  username,
  password,
}: {
  username: string
  password: string
}) {
  const hashedPassword = await getPasswordHash(password)
  await db.transaction(async tx => {
    await tx
      .update(users)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(users.email, username))
      .execute()

    await tx
      .update(passwords)
      .set({ hash: hashedPassword })
      .where(eq(passwords.userId, users.id))
      .execute()
  })
}

export async function signup({
  email,
  password,
  name,
  organizationName,
}: {
  email: string
  username: string
  name: string
  password: string
  organizationName: string
}) {
  const hashedPassword = await getPasswordHash(password)

  const { user } = await createUserWithOrganization({
    user: {
      email: email.toLowerCase(),
      name,
    },
    organizationName,
  })

  await db
    .insert(passwords)
    .values({
      userId: user.id,
      hash: hashedPassword,
    })
    .execute()

  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      expirationDate: getSessionExpirationDate(),
    })
    .returning()

  return { user, session }
}

export async function signupWithConnection({
  email,
  name,
  providerId,
  providerName,

  organizationName,
}: {
  email: string
  name: string
  providerId: string
  providerName: string
  organizationName: string
}) {
  const { user } = await createUserWithOrganization({
    user: {
      email: email.toLowerCase(),
      name,
    },
    organizationName,
  })

  await db
    .insert(connections)
    .values({
      userId: user.id,
      providerId,
      providerName,
    })
    .execute()

  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      expirationDate: getSessionExpirationDate(),
    })
    .returning()

  return { user, session }
}

export async function logout(
  {
    request,
    redirectTo = "/",
  }: {
    request: Request
    redirectTo?: string
  },
  responseInit?: ResponseInit,
) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  )
  const sessionId = authSession.get("sessionId")
  if (sessionId) {
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId))
      .execute()
      .catch(() => {}) // Ignore deletion errors
  }
  throw redirect(safeRedirect(redirectTo), {
    ...responseInit,
    headers: combineHeaders(
      { "set-cookie": await authSessionStorage.destroySession(authSession) },
      responseInit?.headers,
    ),
  })
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10)
  return hash
}

export async function verifyUserPassword(
  where: { username: string } | { id: number },
  password: string,
) {
  const [userWithPassword] = await db
    .select({
      id: users.id,
      hash: passwords.hash,
    })
    .from(users)
    .leftJoin(passwords, eq(users.id, passwords.userId))
    .where(
      "username" in where
        ? eq(users.email, where.username)
        : eq(users.id, where.id),
    )
    .limit(1)

  if (!userWithPassword || !userWithPassword.hash) {
    return null
  }

  const isValid = await bcrypt.compare(password, userWithPassword.hash)

  if (!isValid) {
    return null
  }

  return { id: userWithPassword.id }
}
