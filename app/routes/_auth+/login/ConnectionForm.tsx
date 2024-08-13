import { Form } from "@remix-run/react"
import { z } from "zod"
import { useIsPending } from "~/utils/misc"

export const GITHUB_PROVIDER_NAME = "github"
// to add another provider, set their name here and add it to the providerNames below

export function ProviderConnectionForm({
  redirectTo,
  type,
  providerName,
}: {
  redirectTo?: string | null
  type: "Connect" | "Login" | "Signup"
  providerName: string
}) {
  const label = "Google"
  const formAction = `/auth/${providerName}`
  const isPending = useIsPending({ formAction })
  return (
    <Form
      className="flex items-center justify-center gap-2"
      action={formAction}
      method="POST"
    >
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <button type="submit" className="w-full">
        <span className="inline-flex items-center gap-1.5">
          {label}
          <span>
            {type} with {label}
          </span>
        </span>
      </button>
    </Form>
  )
}
