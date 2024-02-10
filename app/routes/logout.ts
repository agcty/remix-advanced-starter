import { type LoaderFunction } from "@remix-run/node"
import { authenticator } from "~/utils/authenticator.server"

export const loader: LoaderFunction = async ({ request }) => {
  return authenticator.logout(request, { redirectTo: "/login" })
}
