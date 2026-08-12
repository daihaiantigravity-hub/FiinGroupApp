# Authentication Acceptance Checklist

- [ ] New user store migration applied only to a dedicated disposable database.
- [ ] MySqlUserStore integration tests pass against disposable MariaDB.
- [ ] At least one test user created through an approved provisioning path, never by committed seed data.
- [ ] Password hash and verification policy verified.
- [ ] Login success and failure responses compared with legacy behavior.
- [ ] OTP/TOTP expiry, attempt limits and replay prevention tested.
- [ ] Session cookie/token revocation tested.
- [ ] Profile and permission mapping compared with legacy fixtures.
- [ ] Admin 2FA operations protected and audited.
- [ ] React can switch back to legacy adapter using configuration.
- [ ] Security review and technical-pilot acceptance completed.
