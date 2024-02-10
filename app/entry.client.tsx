import { startTransition } from "react"
import { hydrateRoot } from "react-dom/client"
import { RemixBrowser } from "@remix-run/react"

startTransition(() => {
  hydrateRoot(
    document,
    // explicitly not using StrictMode here because it often causes more issues than it solves
    <RemixBrowser />,
  )
})
