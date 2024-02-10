import { Authenticator } from "remix-auth"
import { db } from "./db.server"
import { sessionStorage } from "./session.server"
import { SiweStrategy } from "./siwe-strategy.server"

type User = {
  address: string
}

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(sessionStorage, {
  sessionKey: "sessionKey", // keep in sync
  sessionErrorKey: "sessionErrorKey", // keep in sync
})

authenticator.use(
  new SiweStrategy({ domain: "localhost:3000" }, async ({ message }) => {
    const user = await db.user.upsert({
      create: {
        address: message.address,
      },
      update: {},
      where: {
        address: message.address,
      },
    })
    return { address: user.id, id: user.id }
  }),
  "siwe",
)
