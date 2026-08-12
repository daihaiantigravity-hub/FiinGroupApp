# Authentication Contract Comparison Matrix

**Legacy reference:** `D:\DEV\FiinGroup.Jarvis\server\routes\auth.js`  
**Target:** FiinGroupApp `/api/v2/auth`

| Capability | Legacy endpoint | Target endpoint | Status | Required comparison |
|---|---|---|---|---|
| Login/password | `POST /api/auth/login` | `POST /api/v2/auth/login` | Target contract + service exists; no seeded store | Auth outcome mapping, rate limit, lockout |
| Email OTP/TOTP verification | `POST /api/auth/verify-totp` | `POST /api/v2/auth/verify-otp` | Target pending | Expiry, max attempts, consumed challenge |
| Resend email OTP | `POST /api/auth/resend-otp` | `POST /api/v2/auth/resend-otp` | Target pending | Cooldown, retry limit, masked destination |
| TOTP setup | `POST /api/auth/setup-2fa` | `POST /api/v2/auth/2fa/setup` | Target pending | Secret protection, QR payload, setup expiry |
| Confirm TOTP setup | `POST /api/auth/confirm-setup-2fa` | `POST /api/v2/auth/2fa/confirm` | Target pending | First-code verification and replay prevention |
| Session verification | `GET /api/auth/verify` | `GET /api/v2/auth/session` | Target pending | Expiry, revocation and renewal semantics |
| Current profile | `GET /api/auth/me` | `GET /api/v2/auth/me` | Legacy adapter exists; .NET endpoint pending | Profile field mapping and missing-user behavior |
| Form/action permissions | `GET /api/auth/my-permissions` | `GET /api/v2/auth/permissions` | Legacy adapter exists; .NET endpoint pending | OR merge semantics and action keys |
| Logout | `POST /api/auth/logout` | `POST /api/v2/auth/logout` | Target pending | Actual revocation, cookie clearing and idempotency |
| Admin 2FA setup/reset | `POST /api/auth/admin-*` | Separate admin policy endpoints | Target pending | Admin authorization and audit trail |

## Compatibility rules

- Legacy response details stay inside the legacy adapter; React components use target types.
- A target endpoint must document deliberate differences from legacy behavior.
- A successful target login must not be considered equivalent until session, 2FA and permission tests pass.
- Legacy auth remains the fallback for the internal technical pilot.

## Current blockers

1. New user import/mapping has not been approved.
2. Session token/cookie and refresh rotation design is not implemented.
3. 2FA secret encryption key management is not configured.
4. No disposable identity database has been provisioned for integration tests.
