# Identity Store Design

The FiinGroupApp identity store is a separate database owned by the new application. Jarvis remains the behavioral comparison source during migration but is not a write target for this schema.

## Tables

- `app_users`: identity, status and password hash metadata.
- `app_external_identities`: explicit TFS/other provider subject-to-user mappings; no automatic provisioning.
- `app_roles`, `app_permissions`: named authorization resources.
- `app_user_roles`, `app_role_permissions`: authorization mappings.
- `app_sessions`: hashed refresh sessions and revocation state.
- `app_two_factor_methods`: encrypted TOTP material or method configuration.
- `app_auth_challenges`: short-lived OTP/TOTP challenge state.

## Security decisions

- Passwords are stored only as slow password hashes; plaintext is never persisted.
- Refresh tokens are stored only as SHA-256 hashes.
- TOTP secrets are encrypted with a key external to the database and source code.
- OTP/challenge values expire server-side and are hashed where applicable.
- No default user, role or password is seeded.
- Session revocation is explicit through `revoked_at`.

## Migration constraints

- This migration applies only to the new FiinGroupApp database.
- Rehearse it on a disposable MySQL/MariaDB database first.
- Importing users/permissions from Jarvis requires a separate reviewed mapping and acceptance.
- TFS login can remain compatibility-only with an empty permission snapshot. Enabling `Tfs:RequireIdentityMapping=true` makes unmapped TFS identities fail closed with 403.
- If identity mapping is enabled but its database/migration is unavailable, login fails closed with a safe 503 instead of falling back to empty permissions.
- `backend.IdentityMappingProvisioner` creates only an explicit provider-to-existing-user mapping; it cannot create users, overwrite another mapping or grant permissions.
