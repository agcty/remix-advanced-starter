/* eslint-disable @typescript-eslint/no-namespace */
import { z } from "zod"

// Turn on for debugging
// console.log("ENVIRONMENT VARIABLES:")

// for (const key of Object.keys(process.env)) {
//   console.log(`${key}: ${process.env[key]}`)
// }

const schema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"] as const),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET must not be empty"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID must not be empty"),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, "GOOGLE_CLIENT_SECRET must not be empty"),
  ALLOW_INDEXING: z.enum(["true", "false"]).optional(),
  // If you plan on using Sentry, uncomment this line
  SENTRY_DSN: z.string(),
})

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof schema> {}
  }
}

export function init() {
  const parsed = schema.safeParse(process.env)

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    )

    throw new Error("Invalid envirmonment variables")
  }
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
  return {
    MODE: process.env.NODE_ENV,
    SENTRY_DSN: process.env.SENTRY_DSN,
    ALLOW_INDEXING: process.env.ALLOW_INDEXING,
  }
}

type ENV = ReturnType<typeof getEnv>

declare global {
  // needs to be `var` because it's being set in `entry.server.ts` and would otherwise result in a type error
  // eslint-disable-next-line no-var
  var ENV: ENV

  interface Window {
    ENV: ENV
  }
}
