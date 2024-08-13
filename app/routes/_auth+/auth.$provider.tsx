import { type ActionFunctionArgs } from "@remix-run/node"
import { authenticator, ProviderNameSchema } from "~/utils/authenticator.server"

export async function action({ request, params }: ActionFunctionArgs) {
  const providerName = ProviderNameSchema.parse(params.provider)
  return authenticator.authenticate(providerName, request)
}
