import { createCookieSessionStorage } from "@remix-run/node"
import { createTypedSessionStorage } from "remix-utils/typed-session"
import { z } from "zod"

const sessionSchema = z.object({
  verifiedTime: z.date().optional(),
  sessionId: z.number().optional(),
  expires: z.date().optional(),
})

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "en_session",
    sameSite: "lax", // CSRF protection is advised if changing to 'none'
    path: "/",
    httpOnly: true,
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
})

export const authSessionStorage = createTypedSessionStorage({
  sessionStorage: sessionStorage,
  schema: sessionSchema,
})

// Extend the commitSession function to handle expiration
const originalCommitSession = authSessionStorage.commitSession

Object.defineProperty(authSessionStorage, "commitSession", {
  value: async function commitSession(
    ...args: Parameters<typeof originalCommitSession>
  ) {
    const [session, options] = args

    // if the cookie itself has an expires date, that takes precedence
    if (options?.expires) {
      session.set("expires", options.expires)
    }
    // similar to maxAge
    if (options?.maxAge) {
      session.set("expires", new Date(Date.now() + options.maxAge * 1000))
    }

    const expires = session.has("expires")
      ? new Date(session.get("expires") as Date)
      : undefined
    const setCookieHeader = await originalCommitSession(session, {
      ...options,
      expires,
    })
    return setCookieHeader
  },
})
