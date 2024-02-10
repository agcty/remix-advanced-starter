import { useHydrated } from "remix-utils/use-hydrated"
import { useConnect } from "wagmi"

function ConnectorList() {
  const { connectors, connect } = useConnect()

  return (
    <div className="bg-gray-300 p-8">
      {connectors.map(connector => (
        <ConnectorButton
          key={connector.uid}
          onClick={() => connect({ connector })}
        >
          Metamask
        </ConnectorButton>
      ))}
    </div>
  )
}

function ConnectorButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      className="rounded-2xl bg-gray-100 px-4 py-2 font-medium"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ServerFallback() {
  return (
    <div className="bg-gray-300 p-8">
      <ConnectorButton>Metamask</ConnectorButton>
    </div>
  )
}

// Wallet Options for when the user is not connected to a wallet
export default function WalletOptions() {
  const isHydrated = useHydrated()
  return isHydrated ? <ConnectorList /> : <ServerFallback />
}
