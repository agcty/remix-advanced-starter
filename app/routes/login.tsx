import { type ActionFunction, type LoaderFunction } from "@remix-run/node"
import { authenticator } from "~/utils/authenticator.server"

export const action: ActionFunction = async ({ request, context }) => {
  return await authenticator.authenticate("siwe", request, {
    successRedirect: "/",
    failureRedirect: "/login",
    context,
  })
}

export const loader: LoaderFunction = async ({ request }) => {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  })
}
