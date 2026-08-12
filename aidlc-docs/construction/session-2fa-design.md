# Session and 2FA Target Design

## Session model

- Short-lived access credential for API calls.
- Long-lived refresh session stored in `app_sessions` as a hash only.
- Refresh rotation and revocation are server-side operations.
- Browser delivery should use HttpOnly, Secure, SameSite cookies where deployment topology permits.
- Logout revokes the server session and clears cookies; it is not merely client-side state deletion.

## 2FA model

- `app_auth_challenges` stores expiry, attempt count and consumed state.
- TOTP secret material is encrypted in `app_two_factor_methods`.
- Email OTP values are never stored plaintext in the new store.
- A challenge is single-use and cannot be verified after expiry or consumption.
- Admin 2FA actions require a distinct permission and audit event.

## Implementation gate

These contracts are design boundaries only. A production implementation requires:

1. Key management configuration outside source control.
2. Database-backed session/challenge repositories.
3. Rate limiting and concurrency-safe attempt updates.
4. Contract and security tests against the legacy fixtures.
5. Browser cookie/CORS review for the pilot deployment.
