import { Authenticator } from "remix-auth"
import { sessionStorage } from "./session.server"

type User = {
  address: string
  id: string
}

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(sessionStorage, {
  sessionKey: "sessionKey", // keep in sync
  sessionErrorKey: "sessionErrorKey", // keep in sync
})

// authenticator.use(
//   new MyCustomStrategy({ domain: "localhost:3000" }, async ({ message }) => {
//     // check if the user is already in the database
//     const existingUser = await db.query.user.findFirst({
//       where: eq(user.address, message.address),
//     })

//     if (existingUser) {
//       return {
//         address: existingUser.address,
//         id: existingUser.id,
//       }
//     }

//     // if the user is not in the database, add them
//     await db.insert(user).values({ id: createId(), address: message.address })

//     const createdUser = await db.query.user.findFirst({
//       where: eq(user.address, message.address),
//     })

//     if (!createdUser) {
//       throw new Error("User not created")
//     }

//     console.log("user", createdUser)
//     return {
//       address: createdUser.address,
//       id: createdUser.id,
//     }
//   }),
//   "strategu",
// )
