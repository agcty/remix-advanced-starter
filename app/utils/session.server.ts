import { createCookieSessionStorage } from "@remix-run/node"

export const authSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [process.env.SESSION_SECRET], // replace this with an actual secret
    secure: process.env.NODE_ENV === "production", // enable this in prod only
  },
})

// we have to do this because every time you commit the session you overwrite it
// so we store the expiration time in the cookie and reset it every time we commit
const originalCommitSession = authSessionStorage.commitSession

Object.defineProperty(authSessionStorage, "commitSession", {
  value: async function commitSession(
    ...args: Parameters<typeof originalCommitSession>
  ) {
    const [session, options] = args
    if (options?.expires) {
      session.set("expires", options.expires)
    }
    if (options?.maxAge) {
      session.set("expires", new Date(Date.now() + options.maxAge * 1000))
    }
    const expires = session.has("expires")
      ? new Date(session.get("expires"))
      : undefined
    const setCookieHeader = await originalCommitSession(session, {
      ...options,
      expires,
    })
    return setCookieHeader
  },
})
