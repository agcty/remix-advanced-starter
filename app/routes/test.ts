import { json } from "@remix-run/node"
import { organizations, users } from "schema/users"
import { createUserWithOrganization } from "~/utils/create-user.server"
import { db } from "~/utils/db.server"
import { makeTimings, time } from "~/utils/timing.server"
import { redirectWithToast } from "~/utils/toaster.server"

export async function loader() {
  // insert into organizations (name) values ('test')
  //   await createUserWithOrganization({
  //     name: "test",
  //     email: "hello@dsf.coms",
  //     organizationName: "test",
  //   })
  await db.insert(users).values({ email: "test@asdf.com", role: "CUSTOMER" })
  const timings = makeTimings("test loader")

  const data = await time(() => db.select().from(users), {
    timings,
    type: "getUserId",
    desc: "getUserId in root",
  })

  return json(
    { data },
    { headers: { "Server-Timing": timings.toString() } }, // <-- 3. Create headers
  )

  // return redirectWithToast("/", { description: "test" })
}
