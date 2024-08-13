import aspectRatioPlugin from "@tailwindcss/aspect-ratio"
import containerQueriesPlugin from "@tailwindcss/container-queries"
import formsPlugin from "@tailwindcss/forms"
import typographyPlugin from "@tailwindcss/typography"
import type { Config } from "tailwindcss"
import ariaPlugin from "tailwindcss-react-aria-components"

export default {
  content: ["./app/**/*.{tsx,ts,jsx,js}"],
  theme: {
    extend: {},
  },
  plugins: [
    aspectRatioPlugin,
    containerQueriesPlugin,
    formsPlugin,
    typographyPlugin,
    ariaPlugin,
  ],
} satisfies Config
