import { redirect } from "@remix-run/node"
import bcrypt from "bcryptjs"
import { db } from "db.server"
import { and, eq, gt } from "drizzle-orm"
import { Authenticator } from "remix-auth"
import { safeRedirect } from "remix-utils/safe-redirect"
import { connections, passwords, sessions } from "../../schema/auth"
import { users } from "../../schema/multitenancy"
import { connectionSessionStorage, providers } from "./connections.server.ts"
import { combineHeaders } from "./misc"
import { type ProviderUser } from "./providers/provider.ts"
import { authSessionStorage } from "./session.server.ts"

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME)

export const sessionKey = "sessionId"

export const authenticator = new Authenticator<ProviderUser>(
  connectionSessionStorage,
)

for (const [providerName, provider] of Object.entries(providers)) {
  authenticator.use(provider.getAuthStrategy(), providerName)
}

export async function getUserId(request: Request) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  )
  const sessionId = authSession.get(sessionKey)
  if (!sessionId) return null

  const session = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(
      and(eq(sessions.id, sessionId), gt(sessions.expirationDate, new Date())),
    )
    .get()

  if (!session?.userId) {
    throw redirect("/", {
      headers: {
        "set-cookie": await authSessionStorage.destroySession(authSession),
      },
    })
  }
  return session.userId
}

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
  const session = await db
    .insert(sessions)
    .values({
      userId: user.id,
      expirationDate: getSessionExpirationDate(),
    })
    .returning()
    .get()
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
  return db
    .update(users)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(users.email, username))
    .run()
    .then(() => {
      return db
        .update(passwords)
        .set({ hash: hashedPassword })
        .where(eq(passwords.userId, users.id))
        .run()
    })
}

export async function signup({
  email,
  username,
  password,
  name,
}: {
  email: string
  username: string
  name: string
  password: string
}) {
  const hashedPassword = await getPasswordHash(password)

  const user = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      globalRole: "CUSTOMER",
    })
    .returning()
    .get()

  await db
    .insert(passwords)
    .values({
      userId: user.id,
      hash: hashedPassword,
    })
    .run()

  const session = await db
    .insert(sessions)
    .values({
      userId: user.id,
      expirationDate: getSessionExpirationDate(),
    })
    .returning()
    .get()

  return session
}

export async function signupWithConnection({
  email,
  username,
  name,
  providerId,
  providerName,
  imageUrl,
}: {
  email: string
  username: string
  name: string
  providerId: string
  providerName: string
  imageUrl?: string
}) {
  const user = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      globalRole: "CUSTOMER",
    })
    .returning()
    .get()

  await db
    .insert(connections)
    .values({
      userId: user.id,
      providerId,
      providerName,
    })
    .run()

  // Note: Image handling is omitted as it's not clear how it's implemented in the new schema

  const session = await db
    .insert(sessions)
    .values({
      userId: user.id,
      expirationDate: getSessionExpirationDate(),
    })
    .returning()
    .get()

  return session
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
  const sessionId = authSession.get(sessionKey)
  if (sessionId) {
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId))
      .run()
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
  const userWithPassword = await db
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
    .get()

  if (!userWithPassword || !userWithPassword.hash) {
    return null
  }

  const isValid = await bcrypt.compare(password, userWithPassword.hash)

  if (!isValid) {
    return null
  }

  return { id: userWithPassword.id }
}
