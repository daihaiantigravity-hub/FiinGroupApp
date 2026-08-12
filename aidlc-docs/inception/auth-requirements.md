# Requirements Analysis — Authentication and User Profile

## Source contract

The legacy contract is mounted under `/api/auth` in `FiinGroup.Jarvis/server/routes/auth.js`. It includes login, TOTP/email OTP verification, 2FA setup, session verification, logout, current-user data, permissions, and administrator 2FA operations.

## Migration objective

Provide a new authentication boundary for the React application without changing the legacy login flow or weakening its security. The first implementation must support compatibility reads and an explicit migration/rollback path.

## Required capabilities

- Start login and represent the states: authenticated, OTP required, setup required, or rejected.
- Verify email OTP or authenticator TOTP with bounded attempts and expiry.
- Resolve current user profile and effective permissions.
- Detect expired/invalid sessions and return the user to login.
- Support logout semantics explicitly; do not claim server-side revocation unless implemented.
- Separate normal user operations from administrator 2FA operations.
- Preserve TFS identity behavior as a separate provider contract.

## Security requirements

- Do not store access tokens in localStorage by default.
- Derive actor identity only from a verified session; never accept debug identity from browser input.
- Never log credentials, OTPs, JWTs, cookies, salary fields or authentication request bodies.
- Rate-limit login and OTP verification using a shared/durable mechanism before multi-instance deployment.
- Do not carry forward hardcoded 2FA bypass accounts.
- Treat OTP pending state as sensitive and expire it server-side.

## Out of scope

- Replacing the legacy auth service in this artefact.
- Changing password, TFS, Redmine or database identity data.
- Migrating 2FA secrets or encryption keys without an approved migration design.
