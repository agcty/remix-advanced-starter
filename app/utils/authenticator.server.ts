import { Authenticator } from "remix-auth"
import { GoogleStrategy, SocialsProvider } from "remix-auth-socials"
import { connectionSessionStorage } from "./connections.server"

type User = {
  email: string
  id: string
  username: string
  name: string
  imageUrl?: string
}

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(connectionSessionStorage, {
  sessionKey: "sessionId", // keep in sync
  sessionErrorKey: "sessionErrorKey", // keep in sync
})

// You may specify a <User> type which the strategies will return (this will be stored in the session)
// export let authenticator = new Authenticator<User>(sessionStorage, { sessionKey: '_session' });

const getCallback = (provider: SocialsProvider) => {
  return `http://localhost:3333/auth/${provider}/callback`
}

/**
 * In contrast to some other examples we don't create resources for the user here.
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
      callbackURL: getCallback(SocialsProvider.GOOGLE),
    },
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

// authenticator.use(
//   new FacebookStrategy(
//     {
//       clientID: "YOUR_CLIENT_ID",
//       clientSecret: "YOUR_CLIENT_SECRET",
//       callbackURL: getCallback(SocialsProvider.FACEBOOK),
//     },
//     async ({ profile }) => {},
//   ),
// )
