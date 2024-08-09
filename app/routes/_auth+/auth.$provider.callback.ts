import { type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { getSessionExpirationDate, getUserId } from "~/utils/auth.server"
import { authenticator } from "~/utils/authenticator.server"
import { combineHeaders } from "~/utils/misc"
import { authSessionStorage } from "~/utils/session.server"
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server"

const destroyRedirectTo = { "set-cookie": destroyRedirectToHeader }

export async function loader({ request, params }: LoaderFunctionArgs) {
  const providerName = ProviderNameSchema.parse(params.provider)
  const redirectTo = getRedirectCookieValue(request)
  const label = providerLabels[providerName]

  const authResult = await authenticator
    .authenticate(providerName, request, { throwOnError: true })
    .then(
      data => ({ success: true, data }) as const,
      error => ({ success: false, error }) as const,
    )

  if (!authResult.success) {
    console.error(authResult.error)
    throw await redirectWithToast(
      "/login",
      {
        title: "Auth Failed",
        description: `There was an error authenticating with ${label}.`,
        type: "error",
      },
      { headers: destroyRedirectTo },
    )
  }

  const { data: profile } = authResult

  const existingConnection = await prisma.connection.findUnique({
    select: { userId: true },
    where: {
      providerName_providerId: { providerName, providerId: profile.id },
    },
  })

  const userId = await getUserId(request)

  if (existingConnection) {
    if (userId && existingConnection.userId !== userId) {
      return redirectWithToast(
        "/settings/profile/connections",
        {
          title: "Already Connected",
          description: `The ${label} account is already connected to another account.`,
        },
        { headers: destroyRedirectTo },
      )
    }
    // Connection exists, make a new session
    return makeSession({
      request,
      userId: existingConnection.userId,
      redirectTo,
    })
  }

  // If we're already logged in, then link the account
  if (userId) {
    await prisma.connection.create({
      data: {
        providerName,
        providerId: profile.id,
        userId,
      },
    })
    return redirectWithToast(
      "/settings/profile/connections",
      {
        title: "Connected",
        type: "success",
        description: `Your ${label} account has been connected.`,
      },
      { headers: destroyRedirectTo },
    )
  }

  // If the email matches a user in the db, then link the account and
  // make a new session
  const user = await prisma.user.findUnique({
    select: { id: true },
    where: { email: profile.email.toLowerCase() },
  })
  if (user) {
    await prisma.connection.create({
      data: {
        providerName,
        providerId: profile.id,
        userId: user.id,
      },
    })
    return makeSession(
      { request, userId: user.id, redirectTo },
      {
        headers: await createToastHeaders({
          title: "Connected",
          description: `Your ${label} account has been connected.`,
        }),
      },
    )
  }

  // Otherwise, create a new user account and link the connection
  const newUser = await prisma.user.create({
    data: {
      email: profile.email.toLowerCase(),
      username: normalizeUsername(profile.username ?? profile.email),
      name: profile.name,
      connections: { create: { providerId: profile.id, providerName } },
    },
    select: { id: true },
  })

  return makeSession(
    { request, userId: newUser.id, redirectTo },
    {
      headers: await createToastHeaders({
        title: "Welcome",
        description: `Your account has been created with ${label}.`,
      }),
    },
  )
}

async function makeSession(
  {
    request,
    userId,
    redirectTo,
  }: { request: Request; userId: string; redirectTo?: string | null },
  responseInit?: ResponseInit,
) {
  redirectTo ??= "/"
  const session = await prisma.session.create({
    select: { id: true, expirationDate: true, userId: true },
    data: {
      expirationDate: getSessionExpirationDate(),
      userId,
    },
  })

  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie"),
  )
  authSession.set("sessionId", session.id)

  return redirect(redirectTo, {
    headers: combineHeaders(
      {
        "set-cookie": await authSessionStorage.commitSession(authSession, {
          expires: session.expirationDate,
        }),
      },
      responseInit?.headers,
      destroyRedirectTo,
    ),
  })
}
