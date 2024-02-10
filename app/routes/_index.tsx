import { useCallback } from "react"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { json, useLoaderData, useSubmit } from "@remix-run/react"
import { useHydrated } from "remix-utils/use-hydrated"
import { SiweMessage } from "siwe"
import { useAccount, useSignMessage } from "wagmi"
import { authenticator } from "~/utils/authenticator.server"
import WalletOptions from "~/WalletOptions"

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request)
  return json({ user })
}

export function useSignInWithEthereum() {
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const submit = useSubmit()

  const authenticate = useCallback(async () => {
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum.",
      uri: window.location.origin,
      version: "1",
      chainId,
    })

    const signature = await signMessageAsync({
      message: message.prepareMessage(),
    })

    const formData = new FormData()

    formData.append("message", message.prepareMessage())
    formData.append("signature", signature)

    submit(formData, {
      action: "/login",
      method: "post",
      replace: true,
    })
  }, [address, chainId, signMessageAsync, submit])

  return { authenticate }
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>()

  const { address, isConnecting, isReconnecting } = useAccount()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 bg-gray-100">
      {address}
      {isConnecting ? <p>Connecting...</p> : null}
      {isReconnecting ? <p>Reconnecting...</p> : null}
      {user ? (
        <div>
          <h1>Welcome back, {user.address}</h1>
          <p>You are signed in with Ethereum.</p>
        </div>
      ) : (
        <>
          <ConnectWallet />
        </>
      )}
    </div>
  )
}

function ConnectWallet() {
  const { authenticate } = useSignInWithEthereum()
  const { isConnected } = useAccount()

  return (
    <>
      {isConnected ? (
        <button type="submit" onClick={authenticate}>
          Sign in
        </button>
      ) : (
        <WalletOptions />
      )}
    </>
  )
}
