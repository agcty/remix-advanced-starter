import type React from "react"
import { Switch as AriaSwitch, type SwitchProps } from "react-aria-components"
import clsx from "clsx"

const colors = {
  "dark/zinc": [
    "[--switch-bg-ring:theme(colors.zinc.950/90%)] [--switch-bg:theme(colors.zinc.900)] dark:[--switch-bg-ring:transparent] dark:[--switch-bg:theme(colors.white/25%)]",
    "[--switch-ring:theme(colors.zinc.950/90%)] [--switch-shadow:theme(colors.black/10%)] [--switch:white] dark:[--switch-ring:theme(colors.zinc.700/90%)]",
  ],
  "dark/white": [
    "[--switch-bg-ring:theme(colors.zinc.950/90%)] [--switch-bg:theme(colors.zinc.900)] dark:[--switch-bg-ring:transparent] dark:[--switch-bg:theme(colors.white)]",
    "[--switch-ring:theme(colors.zinc.950/90%)] [--switch-shadow:theme(colors.black/10%)] [--switch:white] dark:[--switch-ring:transparent] dark:[--switch:theme(colors.zinc.900)]",
  ],
  dark: [
    "[--switch-bg-ring:theme(colors.zinc.950/90%)] [--switch-bg:theme(colors.zinc.900)] dark:[--switch-bg-ring:theme(colors.white/15%)]",
    "[--switch-ring:theme(colors.zinc.950/90%)] [--switch-shadow:theme(colors.black/10%)] [--switch:white]",
  ],
  zinc: [
    "[--switch-bg-ring:theme(colors.zinc.700/90%)] [--switch-bg:theme(colors.zinc.600)] dark:[--switch-bg-ring:transparent]",
    "[--switch-shadow:theme(colors.black/10%)] [--switch:white] [--switch-ring:theme(colors.zinc.700/90%)]",
  ],
  white: [
    "[--switch-bg-ring:theme(colors.black/15%)] [--switch-bg:white] dark:[--switch-bg-ring:transparent]",
    "[--switch-shadow:theme(colors.black/10%)] [--switch-ring:transparent] [--switch:theme(colors.zinc.950)]",
  ],
  red: [
    "[--switch-bg-ring:theme(colors.red.700/90%)] [--switch-bg:theme(colors.red.600)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.red.700/90%)] [--switch-shadow:theme(colors.red.900/20%)]",
  ],
  orange: [
    "[--switch-bg-ring:theme(colors.orange.600/90%)] [--switch-bg:theme(colors.orange.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.orange.600/90%)] [--switch-shadow:theme(colors.orange.900/20%)]",
  ],
  amber: [
    "[--switch-bg-ring:theme(colors.amber.500/80%)] [--switch-bg:theme(colors.amber.400)] dark:[--switch-bg-ring:transparent]",
    "[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.amber.950)]",
  ],
  yellow: [
    "[--switch-bg-ring:theme(colors.yellow.400/80%)] [--switch-bg:theme(colors.yellow.300)] dark:[--switch-bg-ring:transparent]",
    "[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.yellow.950)]",
  ],
  lime: [
    "[--switch-bg-ring:theme(colors.lime.400/80%)] [--switch-bg:theme(colors.lime.300)] dark:[--switch-bg-ring:transparent]",
    "[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.lime.950)]",
  ],
  green: [
    "[--switch-bg-ring:theme(colors.green.700/90%)] [--switch-bg:theme(colors.green.600)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.green.700/90%)] [--switch-shadow:theme(colors.green.900/20%)]",
  ],
  emerald: [
    "[--switch-bg-ring:theme(colors.emerald.600/90%)] [--switch-bg:theme(colors.emerald.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.emerald.600/90%)] [--switch-shadow:theme(colors.emerald.900/20%)]",
  ],
  teal: [
    "[--switch-bg-ring:theme(colors.teal.700/90%)] [--switch-bg:theme(colors.teal.600)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.teal.700/90%)] [--switch-shadow:theme(colors.teal.900/20%)]",
  ],
  cyan: [
    "[--switch-bg-ring:theme(colors.cyan.400/80%)] [--switch-bg:theme(colors.cyan.300)] dark:[--switch-bg-ring:transparent]",
    "[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.cyan.950)]",
  ],
  sky: [
    "[--switch-bg-ring:theme(colors.sky.600/80%)] [--switch-bg:theme(colors.sky.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.sky.600/80%)] [--switch-shadow:theme(colors.sky.900/20%)]",
  ],
  blue: [
    "[--switch-bg-ring:theme(colors.blue.700/90%)] [--switch-bg:theme(colors.blue.600)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.blue.700/90%)] [--switch-shadow:theme(colors.blue.900/20%)]",
  ],
  indigo: [
    "[--switch-bg-ring:theme(colors.indigo.600/90%)] [--switch-bg:theme(colors.indigo.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.indigo.600/90%)] [--switch-shadow:theme(colors.indigo.900/20%)]",
  ],
  violet: [
    "[--switch-bg-ring:theme(colors.violet.600/90%)] [--switch-bg:theme(colors.violet.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.violet.600/90%)] [--switch-shadow:theme(colors.violet.900/20%)]",
  ],
  purple: [
    "[--switch-bg-ring:theme(colors.purple.600/90%)] [--switch-bg:theme(colors.purple.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.purple.600/90%)] [--switch-shadow:theme(colors.purple.900/20%)]",
  ],
  fuchsia: [
    "[--switch-bg-ring:theme(colors.fuchsia.600/90%)] [--switch-bg:theme(colors.fuchsia.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.fuchsia.600/90%)] [--switch-shadow:theme(colors.fuchsia.900/20%)]",
  ],
  pink: [
    "[--switch-bg-ring:theme(colors.pink.600/90%)] [--switch-bg:theme(colors.pink.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.pink.600/90%)] [--switch-shadow:theme(colors.pink.900/20%)]",
  ],
  rose: [
    "[--switch-bg-ring:theme(colors.rose.600/90%)] [--switch-bg:theme(colors.rose.500)] dark:[--switch-bg-ring:transparent]",
    "[--switch:white] [--switch-ring:theme(colors.rose.600/90%)] [--switch-shadow:theme(colors.rose.900/20%)]",
  ],
}

type Color = keyof typeof colors

interface CustomSwitchProps extends Omit<SwitchProps, "children"> {
  color?: Color
  className?: string
}

export function Switch({
  color = "dark/zinc",
  className,
  ...props
}: CustomSwitchProps) {
  return (
    <AriaSwitch
      data-slot="control"
      {...props}
      className={({ isSelected, isFocusVisible, isDisabled }) =>
        clsx(
          className,
          // Base styles
          "group relative isolate inline-flex h-6 w-10 cursor-default rounded-full p-[3px] sm:h-5 sm:w-8",
          // Transitions
          "transition duration-200 ease-in-out",
          // Outline and background color in forced-colors mode
          "forced-colors:outline forced-colors:[--switch-bg:Highlight] dark:forced-colors:[--switch-bg:Highlight]",
          // Unchecked
          !isSelected &&
            "bg-zinc-200 ring-1 ring-inset ring-black/5 dark:bg-white/5 dark:ring-white/15",
          // Checked
          isSelected &&
            "bg-[--switch-bg] ring-[--switch-bg-ring] dark:bg-[--switch-bg] dark:ring-[--switch-bg-ring]",
          // Focus
          "focus:outline-none",
          isFocusVisible &&
            "outline outline-2 outline-offset-2 outline-blue-500",
          // Hover
          !isSelected && "hover:ring-black/15 dark:hover:ring-white/25",
          isSelected &&
            "hover:ring-[--switch-bg-ring] dark:hover:ring-[--switch-bg-ring]",
          // Disabled
          isDisabled &&
            "bg-zinc-200 opacity-50 ring-black/5 dark:bg-white/15 dark:ring-white/15",
          // Color specific styles
          colors[color],
        )
      }
    >
      {({ isSelected }) => (
        <span
          aria-hidden="true"
          className={clsx(
            // Basic layout
            "pointer-events-none relative inline-block size-[1.125rem] rounded-full sm:size-3.5",
            // Transition
            "translate-x-0 transition duration-200 ease-in-out",
            // Invisible border
            "border border-transparent",
            // Unchecked
            "bg-white shadow ring-1 ring-black/5",
            // Checked
            isSelected &&
              "translate-x-4 bg-[--switch] shadow-[--switch-shadow] ring-[--switch-ring] sm:translate-x-3",
          )}
        />
      )}
    </AriaSwitch>
  )
}

export function SwitchGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { className?: string }) {
  return (
    <div
      data-slot="control"
      {...props}
      className={clsx(
        className,
        "space-y-3 [&_[data-slot=label]]:font-normal",
        "has-[[data-slot=description]]:space-y-6 [&_[data-slot=label]]:has-[[data-slot=description]]:font-medium",
      )}
    />
  )
}

export function SwitchField({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { className?: string }) {
  return (
    <div
      data-slot="field"
      {...props}
      className={clsx(
        className,
        "grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-1 sm:grid-cols-[1fr_auto]",
        "[&>[data-slot=control]]:col-start-2 [&>[data-slot=control]]:self-center",
        "[&>[data-slot=label]]:col-start-1 [&>[data-slot=label]]:row-start-1 [&>[data-slot=label]]:justify-self-start",
        "[&>[data-slot=description]]:col-start-1 [&>[data-slot=description]]:row-start-2",
        "[&_[data-slot=label]]:has-[[data-slot=description]]:font-medium",
      )}
    />
  )
}
