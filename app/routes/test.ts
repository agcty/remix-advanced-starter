import { json } from "@remix-run/node"
import { db } from "db.server"
import { organizations, users } from "schema/multitenancy"
import { createUserWithOrganization } from "~/utils/create-user.server"
import { makeTimings, time } from "~/utils/timing.server"
import { redirectWithToast } from "~/utils/toaster.server"

export async function loader() {
  // insert into organizations (name) values ('test')
  // createUserWithOrganization({
  //   user: {
  //     email: "alex@gogl.io",
  //     role: "SUPERADMIN",
  //     name: "Alex",
  //   },
  //   organizationName: "test",
  // })

  // // await db.insert(users).values({ email: "test@asdf.com", role: "CUSTOMER" })
  // const timings = makeTimings("test loader")

  // const data = await time(() => db.select().from(users), {
  //   timings,
  //   type: "getUserId",
  //   desc: "getUserId in root",
  // })

  const data = "test"

  return json(
    { data },
    // { headers: { "Server-Timing": timings.toString() } }, // <-- 3. Create headers
  )

  // return redirectWithToast("/", { description: "test" })
}
