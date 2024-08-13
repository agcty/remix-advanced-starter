# Two-Factor Authentication (2FA) Implementation

## Overview

This document outlines the implementation of Two-Factor Authentication (2FA) in our application, focusing on its integration with `authSessionStorage` and `connectionSessionStorage`.

## Purpose of 2FA

Two-Factor Authentication adds an extra layer of security to the user authentication process. It requires users to provide two different authentication factors to verify their identity before granting access to their account.

## Key Components

1. `authSessionStorage`: Manages the main authentication session.
2. `connectionSessionStorage`: Manages temporary sessions during the authentication process, including 2FA.
3. `verifySessionStorage`: Similar to `connectionSessionStorage`, used for temporary storage during verification processes.

## Authentication Flow

### 1. Initial Login

- User enters username and password.
- System validates credentials.

### 2. 2FA Check

If 2FA is required:

- A temporary session is created in `connectionSessionStorage`.
- User is redirected to the 2FA verification page.

If 2FA is not required:

- Proceed directly to creating a full session in `authSessionStorage`.

### 3. 2FA Verification

- User enters the 2FA code.
- System validates the 2FA code.

### 4. Session Creation

If 2FA is valid (or not required):

- Create a full session in `authSessionStorage`.
- Destroy the temporary session in `connectionSessionStorage`.

## Key Function: `handleNewSession`

The `handleNewSession` function in `login.server.ts` is central to this process:

```typescript
export async function handleNewSession(
  {
    request,
    session,
    redirectTo,
    remember,
  }: {
    request: Request
    session: { userId: string; id: string; expirationDate: Date }
    redirectTo?: string
    remember: boolean
  },
  responseInit?: ResponseInit,
) {
  const verification = await prisma.verification.findUnique({
    select: { id: true },
    where: {
      target_type: { target: session.userId, type: twoFAVerificationType },
    },
  })
  const userHasTwoFactor = Boolean(verification)

  if (userHasTwoFactor) {
    const verifySession = await verifySessionStorage.getSession()
    verifySession.set(unverifiedSessionIdKey, session.id)
    verifySession.set(rememberKey, remember)
    const redirectUrl = getRedirectToUrl({
      request,
      type: twoFAVerificationType,
      target: session.userId,
      redirectTo,
    })
    return redirect(
      `${redirectUrl.pathname}?${redirectUrl.searchParams}`,
      combineResponseInits(
        {
          headers: {
            "set-cookie":
              await verifySessionStorage.commitSession(verifySession),
          },
        },
        responseInit,
      ),
    )
  } else {
    const authSession = await authSessionStorage.getSession(
      request.headers.get("cookie"),
    )
    authSession.set(sessionKey, session.id)

    return redirect(
      safeRedirect(redirectTo),
      combineResponseInits(
        {
          headers: {
            "set-cookie": await authSessionStorage.commitSession(authSession, {
              expires: remember ? session.expirationDate : undefined,
            }),
          },
        },
        responseInit,
      ),
    )
  }
}
```

This function:

1. Checks if the user has 2FA enabled.
2. If 2FA is enabled:
   - Creates a temporary session in `verifySessionStorage`.
   - Redirects the user to the 2FA verification page.
3. If 2FA is not enabled:
   - Creates a full session in `authSessionStorage`.
   - Redirects the user to their intended destination.

## Security Considerations

- The use of separate storage mechanisms (`connectionSessionStorage` and `authSessionStorage`) helps isolate the 2FA process from the main session, enhancing security.
- Full authentication is only granted after successful completion of both factors, reducing the risk of unauthorized access.

## Conclusion

This 2FA implementation provides a robust additional layer of security to the authentication process. By leveraging different session storage mechanisms, it maintains a clear separation between the initial login, 2FA verification, and final authenticated session, thereby enhancing the overall security of the application.
