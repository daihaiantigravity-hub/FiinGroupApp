# AI-DLC Audit Log

## 2026-08-12 — FiinGroupApp initialized

- Created an independent migration repository.
- Imported AI-DLC rules from the legacy Jarvis workspace.
- Imported legacy reverse-engineering artefacts as a revalidation baseline.
- Selected incremental migration and Application Platform as the first unit.
- No legacy source or production database was modified.

## 2026-08-12 — Authentication unit analysis

- Revalidated the legacy authentication route surface from `server/routes/auth.js`.
- Documented login, OTP/TOTP, 2FA setup, profile, permissions and admin-2FA boundaries.
- Recorded security constraints for the new React/.NET authentication adapter.
- No authentication code or legacy route was modified.

## 2026-08-12 — Authentication construction started

- Added typed auth models and a legacy `/api/auth` adapter in the React frontend.
- Added in-memory auth state management and login/OTP UI.
- Kept the .NET backend auth replacement out of scope for this increment.
- Frontend build and tests pass.

## 2026-08-12 — Authentication profile and permission slice

- Added legacy profile and permission adapters.
- Added React auth state permissions, protected routes, logout and profile view.
- Preserved in-memory token handling and legacy rollback boundary.
- Frontend and backend verification remain green.

## 2026-08-12 — Authentication contract tests

- Refactored the legacy auth adapter to support injected base URL and fetch implementation.
- Added contract tests for authenticated login, OTP/setup outcomes, bearer propagation, safe errors and logout token clearing.
- All frontend tests pass.

## 2026-08-12 — Legacy comparison direction confirmed

- Recorded `FiinGroup.Jarvis` as the trusted behavioral and code-comparison source.
- Added migration catalog and source-to-target comparison workflow.
- Preserved the separate new user store as the target ownership model.

## 2026-08-12 — Legacy baseline refreshed

- Recounted current JavaScript, HTML, CSS, SQL, route, migration and worker surfaces from the legacy repository.
- Added the refreshed baseline without modifying the legacy source.
- Marked imported historical counts as context requiring revalidation.

## 2026-08-12 — Identity store schema

- Added a separate, unseeded identity schema for users, roles, permissions, sessions and 2FA challenges.
- Documented encryption, hashing, migration and rollback constraints.
- Did not connect the application or modify the Jarvis database.

## 2026-08-12 — Opt-in MySQL identity store

- Added `MySqlUserStore` behind `IdentityStore:Enabled` and a separate connection string.
- Added PBKDF2 password hashing and a backend unit test project.
- Default configuration remains disabled and rejects all credentials.

## 2026-08-12 — Migration safety boundary

- Added an identity migration manifest and explicit startup validation.
- The API now fails fast if identity mode is enabled without a connection string.
- Database migrations remain an explicit operator/deployment action, never an application-startup action.

## 2026-08-12 — Standalone migration runner

- Added `backend.DatabaseMigrator` with checksum validation, migration history and explicit database confirmation.
- Runner refuses targets other than `FiinGroupApp.Identity` and is not called by the API.

## 2026-08-12 — Authentication service tests

- Added backend unit tests for input validation, unknown users, password verification and permission loading.
- Tests use a fake store and do not access any database.

## 2026-08-12 — Authentication contract matrix

- Mapped legacy auth endpoints to target `/api/v2/auth` capabilities.
- Recorded missing session, 2FA, admin policy and disposable-database gates.
- Kept legacy adapter as the technical-pilot fallback.

## 2026-08-12 — Session and 2FA contracts

- Added .NET contracts for server-side sessions, refresh revocation and single-use 2FA challenges.
- Documented cookie, key-management, persistence and rate-limit requirements.
- No production token or placeholder session implementation was enabled.

## 2026-08-12 — Disposable identity integration environment

- Added a MariaDB-only Docker Compose definition for local integration testing.
- Added a runbook for migration, store verification and cleanup.
- Did not start containers or connect to any database.

## 2026-08-12 — Explicit pilot user provisioning

- Added `backend.IdentityProvisioner` with hidden password input and PBKDF2 hashing.
- Provisioning requires explicit confirmation of `FiinGroupApp.Identity`.
- No credentials or seed users were added to the repository.

## 2026-08-12 — Pilot CI and environment documentation

- Added CI builds for backend tests, migration runner and identity provisioner.
- Documented environment variables and evidence required before enabling the new identity store.
- Kept compatibility mode as the default.

## 2026-08-13 — Identity health check

- Added a health check that distinguishes disabled compatibility mode from an unreachable enabled identity database.
- The check never runs against Jarvis because the identity connection is separately configured and the new database name remains enforced by tooling.

## 2026-08-13 — Refresh session persistence

- Added opaque refresh-token generation, SHA-256 hashing and MySQL session create/rotate/revoke operations.
- Added unit coverage for token randomness and one-way hashing.
- Kept session store unregistered until access-token, cookie and 2FA acceptance gates are complete.

## 2026-08-13 — Target development login slice

- Added an environment-configured, Development-only user store for local target-login smoke tests.
- Added React `target-dev` auth mode and `/api/v2` Vite proxy while retaining legacy mode as default.
- Explicitly excluded production use, OTP and persistent session claims from this slice.

## 2026-08-12 — .NET authentication target boundary

- Added .NET authentication contracts, service abstraction and `/api/v2/auth/login` endpoint.
- Registered a development store that rejects all credentials and contains no seeded account.
- Kept the React legacy adapter active for compatibility comparison.
