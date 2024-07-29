import { Authenticator } from "remix-auth"
import { GoogleStrategy, SocialsProvider } from "remix-auth-socials"
import { sessionStorage } from "./session.server"

type User = {
  email: string
  id: string
}

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(sessionStorage, {
  sessionKey: "sessionKey", // keep in sync
  sessionErrorKey: "sessionErrorKey", // keep in sync
})

// You may specify a <User> type which the strategies will return (this will be stored in the session)
// export let authenticator = new Authenticator<User>(sessionStorage, { sessionKey: '_session' });

const getCallback = (provider: SocialsProvider) => {
  return `http://localhost:3333/auth/${provider}/callback`
}

authenticator.use(
  new GoogleStrategy(
    {
      clientID: "YOUR_CLIENT_ID",
      clientSecret: "YOUR_CLIENT_SECRET",
      callbackURL: getCallback(SocialsProvider.GOOGLE),
    },
    async ({ profile }) => {
      // here you would find or create a user in your database
      return { email: profile.emails[0].value, id: profile.id } satisfies User
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
