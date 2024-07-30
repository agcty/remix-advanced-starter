import "./tailwind.css"
import { RouterProvider } from "react-aria-components"
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cookieToInitialState, WagmiProvider } from "wagmi"
import { GeneralErrorBoundary } from "./components/error-boundary"
import { useTheme } from "./routes/api+/theme-switch"
import Toaster from "./routes/components/Toast"
import { config } from "./utils/chain-config"
import { ClientHintCheck, getHints } from "./utils/client-hints"
import { getEnv } from "./utils/env.server"
import { combineHeaders, getDomainUrl } from "./utils/misc"
import { useNonce } from "./utils/nonce-provider"
import { getTheme, type Theme } from "./utils/theme.server"
import { makeTimings } from "./utils/timing.server"
import { getToast } from "./utils/toaster.server"
import { useToast } from "./utils/use-toast"

const queryClient = new QueryClient()

export const loader: LoaderFunction = async ({ request }) => {
  const cookie = request.headers.get("cookie")
  const connectorState = cookie
    ?.split(";")
    .find(c => c.trim().startsWith("wagmi.store"))
    ?.trim()

  const { toast, headers: toastHeaders } = await getToast(request)
  const timings = makeTimings("root loader")

  return json(
    {
      ENV: getEnv(),
      connectorState,
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: getTheme(request),
        },
      },
      toast,
    },
    {
      headers: combineHeaders(
        { "Server-Timing": timings.toString() },
        toastHeaders,
      ),
    },
  )
}

export default function App() {
  const { ENV, connectorState, toast } = useLoaderData<typeof loader>()
  const initialState = cookieToInitialState(config, connectorState)
  const navigate = useNavigate()
  const nonce = useNonce()
  const theme = useTheme()
  const allowIndexing = ENV.ALLOW_INDEXING !== "false"
  useToast(toast)

  return (
    <Document
      nonce={nonce}
      theme={theme}
      allowIndexing={allowIndexing}
      env={ENV}
    >
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider navigate={navigate}>
            <Outlet />
          </RouterProvider>
        </QueryClientProvider>
      </WagmiProvider>
      <Toaster closeButton position="top-center" theme={theme} />
    </Document>
  )
}

function Document({
  children,
  nonce,
  theme = "light",
  env = {},
  allowIndexing = true,
}: {
  children: React.ReactNode
  nonce: string
  theme?: Theme
  env?: Record<string, string>
  allowIndexing?: boolean
}) {
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {allowIndexing ? null : (
          <meta name="robots" content="noindex, nofollow" />
        )}
        <Links />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  // the nonce doesn't rely on the loader so we can access that
  const nonce = useNonce()

  // NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
  // likely failed to run so we have to do the best we can.
  // We could probably do better than this (it's possible the loader did run).
  // This would require a change in Remix.

  // Just make sure your root route never errors out and you'll always be able
  // to give the user a better UX.

  return (
    <Document nonce={nonce}>
      <GeneralErrorBoundary />
    </Document>
  )
}
