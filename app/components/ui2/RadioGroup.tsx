import React, { type ReactNode } from "react"
import {
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioProps,
  type ValidationResult,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { Description, FieldError, Label } from "./Field"
import { composeTailwindRenderProps, focusRing } from "./utils"

export interface RadioGroupProps extends Omit<RACRadioGroupProps, "children"> {
  label?: string
  children?: ReactNode
  description?: string
  errorMessage?: string | ((validation: ValidationResult) => string)
}

export function RadioGroup(props: RadioGroupProps) {
  return (
    <RACRadioGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "space-y-3 has-[[data-slot=description]]:space-y-6 [&_[data-slot=label]]:font-normal [&_[data-slot=label]]:has-[[data-slot=description]]:font-medium",
      )}
    >
      {/* Preserving the existing structure */}
      <Label>{props.label}</Label>
      <div className="group-orientation-horizontal:flex-row group-orientation-horizontal:gap-4 flex flex-col gap-2">
        {props.children}
      </div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </RACRadioGroup>
  )
}

// Combining styles from both codebases
const styles = tv({
  extend: focusRing,
  base: [
    "relative isolate flex shrink-0 rounded-full",
    "size-[1.1875rem] sm:size-[1.0625rem]",
    "before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-white before:shadow",
    "before:group-data-[checked]:bg-[--radio-checked-bg]",
    "dark:before:hidden",
    "dark:bg-white/5 dark:group-data-[checked]:bg-[--radio-checked-bg]",
    "border border-zinc-950/15 group-data-[checked]:border-transparent group-data-[checked]:group-data-[hover]:border-transparent group-data-[hover]:border-zinc-950/30 group-data-[checked]:bg-[--radio-checked-border]",
    "dark:border-white/15 dark:group-data-[checked]:border-white/5 dark:group-data-[checked]:group-data-[hover]:border-white/5 dark:group-data-[hover]:border-white/30",
    "after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_1px_theme(colors.white/15%)]",
    "dark:after:-inset-px dark:after:hidden dark:after:rounded-full dark:group-data-[checked]:after:block",
    "[--radio-indicator:transparent] group-data-[checked]:[--radio-indicator:var(--radio-checked-indicator)] group-data-[checked]:group-data-[hover]:[--radio-indicator:var(--radio-checked-indicator)] group-data-[hover]:[--radio-indicator:theme(colors.zinc.900/10%)]",
    "dark:group-data-[checked]:group-data-[hover]:[--radio-indicator:var(--radio-checked-indicator)] dark:group-data-[hover]:[--radio-indicator:theme(colors.zinc.700)]",
    "group-data-[focus]:outline group-data-[focus]:outline-2 group-data-[focus]:outline-offset-2 group-data-[focus]:outline-blue-500",
    "group-data-[disabled]:opacity-50",
    "group-data-[disabled]:border-zinc-950/25 group-data-[disabled]:bg-zinc-950/5 group-data-[disabled]:[--radio-checked-indicator:theme(colors.zinc.950/50%)] group-data-[disabled]:before:bg-transparent",
    "dark:group-data-[disabled]:border-white/20 dark:group-data-[disabled]:bg-white/[2.5%] dark:group-data-[disabled]:[--radio-checked-indicator:theme(colors.white/50%)] dark:group-data-[disabled]:group-data-[checked]:after:hidden",
  ],
  variants: {
    isSelected: {
      false:
        "border-gray-400 dark:border-zinc-400 group-pressed:border-gray-500 dark:group-pressed:border-zinc-300",
      true: "border-[7px] border-gray-700 dark:border-slate-300 forced-colors:!border-[Highlight] group-pressed:border-gray-800 dark:group-pressed:border-slate-200",
    },
    isInvalid: {
      true: "border-red-700 dark:border-red-600 group-pressed:border-red-800 dark:group-pressed:border-red-700 forced-colors:!border-[Mark]",
    },
    isDisabled: {
      true: "border-gray-200 dark:border-zinc-700 forced-colors:!border-[GrayText]",
    },
  },
})

// Color variants from Codebase A
const colors = {
  "dark/zinc": [
    "[--radio-checked-bg:theme(colors.zinc.900)] [--radio-checked-border:theme(colors.zinc.950/90%)] [--radio-checked-indicator:theme(colors.white)]",
    "dark:[--radio-checked-bg:theme(colors.zinc.600)]",
  ],
  "dark/white": [
    "[--radio-checked-bg:theme(colors.zinc.900)] [--radio-checked-border:theme(colors.zinc.950/90%)] [--radio-checked-indicator:theme(colors.white)]",
    "dark:[--radio-checked-bg:theme(colors.white)] dark:[--radio-checked-border:theme(colors.zinc.950/15%)] dark:[--radio-checked-indicator:theme(colors.zinc.900)]",
  ],
  white:
    "[--radio-checked-bg:theme(colors.white)] [--radio-checked-border:theme(colors.zinc.950/15%)] [--radio-checked-indicator:theme(colors.zinc.900)]",
  dark: "[--radio-checked-bg:theme(colors.zinc.900)] [--radio-checked-border:theme(colors.zinc.950/90%)] [--radio-checked-indicator:theme(colors.white)]",
  zinc: "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.zinc.600)] [--radio-checked-border:theme(colors.zinc.700/90%)]",
  red: "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.red.600)] [--radio-checked-border:theme(colors.red.700/90%)]",
  orange:
    "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.orange.500)] [--radio-checked-border:theme(colors.orange.600/90%)]",
  amber:
    "[--radio-checked-bg:theme(colors.amber.400)] [--radio-checked-border:theme(colors.amber.500/80%)] [--radio-checked-indicator:theme(colors.amber.950)]",
  yellow:
    "[--radio-checked-bg:theme(colors.yellow.300)] [--radio-checked-border:theme(colors.yellow.400/80%)] [--radio-checked-indicator:theme(colors.yellow.950)]",
  lime: "[--radio-checked-bg:theme(colors.lime.300)] [--radio-checked-border:theme(colors.lime.400/80%)] [--radio-checked-indicator:theme(colors.lime.950)]",
  green:
    "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.green.600)] [--radio-checked-border:theme(colors.green.700/90%)]",
  emerald:
    "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.emerald.600)] [--radio-checked-border:theme(colors.emerald.700/90%)]",
  teal: "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.teal.600)] [--radio-checked-border:theme(colors.teal.700/90%)]",
  cyan: "[--radio-checked-bg:theme(colors.cyan.300)] [--radio-checked-border:theme(colors.cyan.400/80%)] [--radio-checked-indicator:theme(colors.cyan.950)]",
  sky: "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.sky.500)] [--radio-checked-border:theme(colors.sky.600/80%)]",
  blue: "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.blue.600)] [--radio-checked-border:theme(colors.blue.700/90%)]",
  indigo:
    "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.indigo.500)] [--radio-checked-border:theme(colors.indigo.600/90%)]",
  violet:
    "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.violet.500)] [--radio-checked-border:theme(colors.violet.600/90%)]",
  purple:
    "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.purple.500)] [--radio-checked-border:theme(colors.purple.600/90%)]",
  fuchsia:
    "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.fuchsia.500)] [--radio-checked-border:theme(colors.fuchsia.600/90%)]",
  pink: "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.pink.500)] [--radio-checked-border:theme(colors.pink.600/90%)]",
  rose: "[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.rose.500)] [--radio-checked-border:theme(colors.rose.600/90%)]",
}

type Color = keyof typeof colors

export interface ExtendedRadioProps extends RadioProps {
  color?: Color
}

export function Radio({ color = "dark/zinc", ...props }: ExtendedRadioProps) {
  return (
    <RACRadio
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group inline-flex items-center gap-2 text-sm text-gray-800 transition focus:outline-none disabled:text-gray-300 dark:text-zinc-200 dark:disabled:text-zinc-600 forced-colors:disabled:text-[GrayText]",
      )}
    >
      {renderProps => (
        <>
          <div className={styles(renderProps)}>
            <span
              className={`size-full rounded-full border-[4.5px] border-transparent bg-[--radio-indicator] bg-clip-padding forced-colors:border-[Canvas] forced-colors:group-data-[checked]:border-[Highlight] ${colors[color]}`}
            />
          </div>
          {props.children}
        </>
      )}
    </RACRadio>
  )
}
