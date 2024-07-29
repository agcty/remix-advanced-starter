import { startTransition } from "react"
import { hydrateRoot } from "react-dom/client"
import { RemixBrowser } from "@remix-run/react"

if (ENV.MODE === "production" && ENV.SENTRY_DSN) {
  void import("./utils/monitoring.client").then(({ init }) => init())
}

startTransition(() => {
  hydrateRoot(document, <RemixBrowser />)
})
