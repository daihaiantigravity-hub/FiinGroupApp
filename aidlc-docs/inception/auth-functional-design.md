# Functional Design — Authentication and User Profile

## Proposed new boundary

The new API will expose `/api/v2/auth/*` and use a session mechanism compatible with HttpOnly, Secure, SameSite cookies. The React app will use a typed state machine rather than assuming every login response contains an access token.

## Login states

```text
START
  → AUTHENTICATED
  → OTP_REQUIRED(method, maskedDestination, pendingId)
  → SETUP_REQUIRED(setupId)
  → REJECTED(errorCode)
```

`pendingId` and `setupId` are opaque, short-lived values. The client must not interpret them as JWTs or persist them beyond the required flow.

## New client interfaces

- `POST /api/v2/auth/login` — returns a typed login outcome.
- `POST /api/v2/auth/verify-otp` — completes an OTP/TOTP challenge.
- `GET /api/v2/auth/me` — returns the current profile.
- `GET /api/v2/auth/permissions` — returns effective form/action permissions.
- `POST /api/v2/auth/logout` — ends the client session and returns a deterministic result.

Administrator 2FA operations require a separate policy and are not part of the normal user client.

## Compatibility

Until the new backend owns authentication, the frontend must call a dedicated legacy-auth adapter. The adapter maps legacy response shapes to the new typed login outcome and must not expose legacy response details throughout React components.

## Failure behavior

- 400: malformed input.
- 401: invalid credentials, expired challenge or unauthenticated session.
- 403: authenticated user lacks required permission.
- 429: rate limit exceeded with `Retry-After`.
- 500: generic safe error with a correlation id; no secret or database detail.
