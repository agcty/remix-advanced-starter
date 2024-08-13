import { Authenticator } from "remix-auth"
import { GoogleStrategy } from "remix-auth-google"
import { connectionSessionStorage } from "./connections.server"

type User = {
  email: string
  id: string
  username: string
  name: string
  imageUrl?: string
}

export const authenticator = new Authenticator<User>(connectionSessionStorage, {
  sessionKey: "sessionId", // keep in sync
  sessionErrorKey: "sessionErrorKey", // keep in sync
})

export const socialsProviders = ["google"] as const
export type SocialsProvider = (typeof socialsProviders)[number]

const getCallback = (provider: SocialsProvider) => {
  return `http://localhost:3000/auth/${provider}/callback`
}

/**
 * We don't create resources for the user here.
 * This is merely to populate the connectionSession with data about the user.
 * The user and other resources will be created in the callback route.
 * The reason for this is that we might want some intermediary steps before creating the user, like asking for more information.
 * We can only do that in the callback route as the user is already authenticated.
 * In addition, the callback route supports redirects and other things which the authenticator doesn't.
 */
authenticator.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallback("google"),
    },
    // For strategies that set up a connection, we just return the user object and don't create any resources.
    async ({ profile }) => {
      return {
        email: profile.emails[0].value,
        id: profile.id,
        imageUrl: profile.photos?.[0].value,
        name: `${profile.name.givenName} ${profile.name.familyName}`.trimStart(),
        username: profile.displayName,
      } satisfies User
    },
  ),
)

export const normalizeEmail = (s: string) => s.toLowerCase()

export const normalizeUsername = (s: string) =>
  s.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
