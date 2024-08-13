import { ProviderConnectionForm } from "./ConnectionForm"

export default function Test() {
  return (
    <ProviderConnectionForm
      redirectTo={null}
      type="Login"
      providerName="google"
    />
  )
}
