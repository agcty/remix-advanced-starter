import { organizations, users } from "schema/users"
import { createUserWithOrganization } from "~/utils/create-user.server"
import { db } from "~/utils/db.server"
import { redirectWithToast } from "~/utils/toaster.server"

export async function loader() {
  // insert into organizations (name) values ('test')
//   await createUserWithOrganization({
//     name: "test",
//     email: "hello@dsf.coms",
//     organizationName: "test",
//   })
//   await db.insert(organizations).values({ name: "test" })
  const data = await db.select().from(users)
  //   return data

  return redirectWithToast("/", { description: "test" })
}
