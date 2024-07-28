import "./tailwind.css"
import { json, type LoaderFunction } from "@remix-run/node"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate,
} from "@remix-run/react"
import { RouterProvider } from "react-aria-components"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cookieToInitialState, WagmiProvider } from "wagmi"
import { config } from "./utils/chain-config"
import { getEnv } from "./utils/env.server"

const queryClient = new QueryClient()

export const loader: LoaderFunction = async ({ request }) => {
  const cookie = request.headers.get("cookie")
  const connectorState = cookie
    ?.split(";")
    .find(c => c.trim().startsWith("wagmi.store"))
    ?.trim()
  return json({ env: getEnv(), connectorState })
}

export default function App() {
  const { env, connectorState } = useLoaderData<typeof loader>()
  const initialState = cookieToInitialState(config, connectorState)
  const navigate = useNavigate()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <WagmiProvider config={config} initialState={initialState}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider navigate={navigate}>
              <Outlet />
            </RouterProvider>
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
