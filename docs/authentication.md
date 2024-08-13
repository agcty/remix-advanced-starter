# Authentication Session Management

## Overview

This document explains the two main session storage mechanisms used in our authentication system: `authSessionStorage` and `connectionSessionStorage`. It outlines their purposes, usage, and how they interact during the authentication process.

## authSessionStorage

### Purpose

`authSessionStorage` is responsible for managing the user's authenticated session after they have successfully logged in.

### Key Characteristics

- Long-lived session (typically lasts for the duration of the user's login)
- Stores the user's session ID
- Used to check if a user is authenticated for protected routes

### Usage

```typescript
const authSession = await authSessionStorage.getSession(
  request.headers.get("cookie"),
)
const sessionId = authSession.get(sessionKey)
```

## connectionSessionStorage

### Purpose

`connectionSessionStorage` is used to manage temporary data during the OAuth authentication flow with third-party providers.

### Key Characteristics

- Short-lived session (10 minutes by default)
- Stores temporary data needed for OAuth process
- Becomes irrelevant after successful authentication

### Usage

```typescript
const connectionSession = await connectionSessionStorage.getSession(
  request.headers.get("cookie"),
)
```

## Authentication Flow and Session "Spillover"

1. OAuth Initiation:

   - User starts OAuth flow
   - `connectionSessionStorage` is created to manage the process

2. OAuth Completion:

   - User authenticates with the provider
   - Application receives user data from the provider

3. Session "Spillover":

   - Application creates a new session in the database
   - `authSessionStorage` is set up with the new session ID

   ```typescript
   const session = await prisma.session.create({
     data: {
       expirationDate: getSessionExpirationDate(),
       userId,
     },
   })
   const authSession = await authSessionStorage.getSession(
     request.headers.get("cookie"),
   )
   authSession.set(sessionKey, session.id)
   ```

4. Post-Authentication:
   - `authSessionStorage` is now used for session management
   - `connectionSessionStorage` is no longer actively used (expires after 10 minutes)

## Best Practices

1. Use `authSessionStorage` for checking authentication status and managing user sessions.
2. Use `connectionSessionStorage` only during the OAuth flow.
3. Consider explicitly destroying the `connectionSessionStorage` after successful authentication for optimization.

## Conclusion

The separation of `authSessionStorage` and `connectionSessionStorage` provides a clear distinction between the OAuth process and ongoing session management. This design allows for flexible authentication methods while maintaining consistent session handling post-authentication.
