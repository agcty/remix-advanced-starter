import { createCookieSessionStorage } from "@remix-run/node"
import { createTypedSessionStorage } from "remix-utils/typed-session"
import { z } from "zod"

const sessionSchema = z.object({
  onboardingEmail: z.string().optional(),
  prefilledProfile: z.unknown().optional(),
  providerId: z.string().optional(),
  unverifiedSessionId: z.string().optional(),
  remember: z.boolean().optional(),
  resetPasswordUsername: z.string().optional(),
  newEmailAddress: z.string().optional(),
})

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "en_verification",
    sameSite: "lax", // CSRF protection is advised if changing to 'none'
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
})

/**
 * This session handles the verification process for the user.
 * It allows us to do things like 2FA.
 */
export const verifySessionStorage = createTypedSessionStorage({
  sessionStorage: sessionStorage,
  schema: sessionSchema,
})
