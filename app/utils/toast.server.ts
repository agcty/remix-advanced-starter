import { createId as cuid } from "@paralleldrive/cuid2"
import { createCookieSessionStorage, redirect } from "@remix-run/node"
import { createTypedSessionStorage } from "remix-utils/typed-session"
import { z } from "zod"
import { combineHeaders } from "./misc"

const ToastSchema = z.object({
  description: z.string(),
  id: z.string().default(() => cuid()),
  title: z.string().optional(),
  type: z.enum(["message", "success", "error"]).default("message"),
})

export type Toast = z.infer<typeof ToastSchema>
export type ToastInput = z.input<typeof ToastSchema>

const sessionSchema = z.object({
  toast: ToastSchema.optional(),
})

const cookieSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "en_toast",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
})

export const toastSessionStorage = createTypedSessionStorage({
  sessionStorage: cookieSessionStorage,
  schema: sessionSchema,
})

export async function redirectWithToast(
  url: string,
  toast: ToastInput,
  init?: ResponseInit,
) {
  return redirect(url, {
    ...init,
    headers: combineHeaders(init?.headers, await createToastHeaders(toast)),
  })
}

export async function createToastHeaders(toastInput: ToastInput) {
  const session = await toastSessionStorage.getSession()
  const toast = ToastSchema.parse(toastInput)
  session.set("toast", toast)
  const cookie = await toastSessionStorage.commitSession(session)
  return new Headers({ "set-cookie": cookie })
}

export async function getToast(request: Request) {
  const session = await toastSessionStorage.getSession(
    request.headers.get("cookie"),
  )
  const toast = session.get("toast")
  return {
    toast,
    headers: toast
      ? new Headers({
          "set-cookie": await toastSessionStorage.destroySession(session),
        })
      : null,
  }
}
