import { createCookieSessionStorage } from "@remix-run/node"

/**
 * The cookie session storage for the OAUTH providers.
 * We could use a typed session but it's not necessary for this use case as we are only using it via the authenticator which is typed.
 */
export const connectionSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "en_connection",
    sameSite: "lax", // CSRF protection is advised if changing to 'none'
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
})
