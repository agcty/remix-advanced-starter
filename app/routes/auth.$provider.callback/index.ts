import { type LoaderFunctionArgs } from "@remix-run/node"
import { z } from "zod"
import { getUserId } from "~/utils/auth.server"
import { authenticator } from "~/utils/authenticator.server"
import { createUserWithOrganization } from "~/utils/multitenancy/user.server"
import {
  destroyRedirectToHeader,
  getRedirectCookieValue,
} from "~/utils/redirect-cookie.server"
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server"
import {
  createConnection,
  findExistingConnection,
  findUserByEmail,
  makeSession,
} from "./helpers"

const destroyRedirectTo = { "set-cookie": destroyRedirectToHeader }

const validProviders = ["google"] as const
const ProviderNameSchema = z.enum(validProviders)

export async function loader({ request, params }: LoaderFunctionArgs) {
  const providerName = ProviderNameSchema.parse(params.provider)
  const redirectTo = getRedirectCookieValue(request)
  const label = providerName.charAt(0).toUpperCase() + providerName.slice(1)

  // The connectionSessionStorage is being populated here
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

  const existingConnection = await findExistingConnection(
    providerName,
    profile.id,
  )

  const userId = await getUserId(request)

  // If the connection already exists, then redirect to the connections page
  if (existingConnection && userId) {
    if (existingConnection.userId === userId) {
      return redirectWithToast(
        "/settings/profile/connections",
        {
          title: "Already Connected",
          description: `Your "${profile.username}" ${label} account is already connected.`,
        },
        { headers: destroyRedirectTo },
      )
    } else {
      return redirectWithToast(
        "/settings/profile/connections",
        {
          title: "Already Connected",
          description: `The "${profile.username}" ${label} account is already connected to another account.`,
        },
        { headers: destroyRedirectTo },
      )
    }
  }

  // If we're already logged but no connection, then link the account
  // the existance of a userId means we're already logged in (authSessionStorage populated)
  if (userId) {
    await createConnection({
      providerName,
      providerId: profile.id,
      userId,
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

  // User and connection exist already? Make a new session
  if (existingConnection) {
    return makeSession({ request, userId: existingConnection.userId })
  }

  // The user exists in the database and email matches the profile email
  const user = await findUserByEmail(profile.email.toLowerCase())
  if (user) {
    await createConnection({
      providerName,
      providerId: profile.id,
      userId: user.id,
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

  // If no user exists at all, create a new user and organization
  const { user: newUser } = await createUserWithOrganization({
    user: {
      email: profile.email.toLowerCase(),
      name: profile.name,
    },
    organizationName: `${profile.name}'s Organization`,
  })

  await createConnection({
    providerName,
    providerId: profile.id,
    userId: newUser.id,
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
