import "./tailwind.css"
import { json, type LoaderFunction } from "@remix-run/node"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "./utils/chain-config"
import { getEnv } from "./utils/env.server"

const queryClient = new QueryClient()

export const loader: LoaderFunction = async () => {
  return json({ env: getEnv() })
}

export default function App() {
  const { env } = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <Outlet />
          </QueryClientProvider>
        </WagmiProvider>
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
      </body>
    </html>
  )
}
