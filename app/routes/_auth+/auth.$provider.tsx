import { type ActionFunctionArgs } from "@remix-run/node"
import { authenticator } from "~/utils/authenticator.server"

export async function action({ request, params }: ActionFunctionArgs) {
  return authenticator.authenticate(params.provider!, request)
}
