import { useConnect } from "wagmi"

function HydratedConnectorList() {
  const { connectors, connect } = useConnect()

  return (
    <div className="w-full max-w-sm rounded-lg bg-gray-300 p-8">
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
      className="w-full rounded-2xl bg-gray-100 px-4 py-2 font-medium"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function WalletOptions() {
  return <HydratedConnectorList />
}
