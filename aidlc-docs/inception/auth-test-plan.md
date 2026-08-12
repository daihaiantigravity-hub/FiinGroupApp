# Test Plan — Authentication and User Profile

## Contract tests

- Successful login without 2FA.
- Login requiring email OTP.
- Login requiring authenticator TOTP.
- Login requiring first-time setup.
- Invalid, expired and over-attempted challenges.
- Invalid credentials and rate limiting.
- Current-user profile and merged permissions.
- Unauthenticated and forbidden responses.
- Logout behavior and session expiry.
- TFS-provider identity mapping.

## Security tests

- Request logs contain no password, OTP, token, cookie or sensitive profile fields.
- Browser input cannot spoof actor identity.
- Bypass-account behavior is absent.
- Pending challenge cannot be reused after success or expiry.
- Admin 2FA endpoints reject non-admin users.
- CORS and cookie attributes match the approved deployment origin.

## Migration tests

- React legacy adapter maps every supported legacy outcome.
- A feature flag can return the user to the legacy login route.
- New authentication failures do not invalidate existing legacy sessions.
