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

## 2026-08-13 — TFS domain login slice

- Added target `/api/v2/auth/login` support for `authProvider=tfs` with domain username parsing and NTLM connectionData validation.
- Added React provider/domain fields and preserved the same legacy request contract.
- TFS credentials are request-scoped and are not logged or persisted.

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

## 2026-08-13 — TFS pilot session and auth contract slice

- Added an in-memory HttpOnly session for the technical pilot after successful TFS validation.
- Added target session, current-profile, permissions and logout endpoints.
- Added provider validation and session revocation tests.
- Explicitly kept persistent session storage, refresh rotation and 2FA behind the authentication acceptance gate.

## 2026-08-13 — Permission contract comparison slice

- Confirmed Jarvis TFS login intentionally returns empty form/action permissions because the TFS identity has no Jarvis database permission row.
- Preserved separate form permissions and action permissions in the target React auth state.
- Added target route-guard support for form access and explicit action codes; no business module is enabled by this slice.

## 2026-08-13 — Application Platform dashboard slice

- Added a React read-only platform dashboard for authenticated pilot users.
- Added target API ping/health visibility and permission/session summaries.
- Kept Jarvis business dashboard data behind a documented read-only adapter boundary; no legacy data mutation or fabricated target metrics were introduced.

## 2026-08-13 — Legacy dashboard compatibility adapter

- Verified Jarvis global JWT protection for `/api/dashboard/*`.
- Added a React read-only adapter for `/api/dashboard/stats` in legacy mode only.
- Kept target TFS mode out of legacy business data until token exchange or a .NET read model is approved.

## 2026-08-13 — Target Dashboard read model

- Added disabled-by-default `/api/v2/dashboard/stats` read model with a separate legacy operational connection boundary.
- Preserved Jarvis aggregate semantics for employee, project, revenue and pending evaluation statistics.
- Added safe configuration/error handling and documented the read-only clone acceptance gate.
- Added fail-closed `dashboard` form access/view authorization; TFS accounts without mapped permissions cannot read business aggregates.

## 2026-08-13 — TFS external identity mapping boundary

- Added the unseeded `app_external_identities` schema and target resolver contract.
- Kept mapping opt-in; TFS login never provisions a target user or permission.
- Added `Tfs:RequireIdentityMapping` fail-closed behavior for approved identity-store deployments.
- Added an explicit mapping provisioner with database confirmation and no automatic role/permission grants.

## 2026-08-13 — Mapping provisioner input validation

- Added friendly validation for placeholder and malformed MySQL connection strings.
- Added safe connection failure guidance without printing connection values or secrets.

## 2026-08-13 — Migration runner manifest compatibility

- Fixed manifest deserialization to accept the repository's lower-case JSON property names.
- Added explicit validation for the target database and non-empty migration list before execution.

## 2026-08-13 — TFS project-management UI compatibility slice

- Compared the target project-management and project-tasks layouts with the trusted
  Jarvis HTML/CSS/JavaScript source.
- Added the Jarvis-aligned project-management sheet shell and project-tasks toolbar,
  task grid columns, filters, summary cards and read-only Gantt projection.
- Extended the TFS work-item projection with source-aligned status, progress, plan,
  priority, product, creator and date fallback mappings.
- Kept Jarvis DB-backed summary, PMBOK data, resource view and all mutations outside
  the target until their source contract and database access are approved.
- Verified TypeScript strict compilation, Vite production build and .NET API build;
  no legacy repository files were modified.

## 2026-08-13 — TFS browser usability checkpoint

- Added source-aligned loading, empty, refresh and count states for Teams,
  Iterations and Work items in the target browser.
- Kept all three views read-only and backed by the existing approved TFS API
  contracts; no new mutation or database dependency was introduced.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Project-task toolbar parity checkpoint

- Added the remaining Jarvis task-toolbar controls to the target UI as disabled
  read-only controls: Công cụ, Đường găng, Baseline, Lịch sử and Xuất/Nhập.
- Each unavailable control explains that its Jarvis DB/API contract is not yet
  available; no placeholder action or mutation was added.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Project-management TFS KPI checkpoint

- When a project is selected in `projectmanagement`, the target now loads Teams
  and Work items from the existing TFS read-only APIs so the source-aligned KPI
  strip is populated immediately.
- Jarvis DB-backed `pm-flow` data remains explicitly unavailable; no business
  metrics are fabricated and no mutation path was added.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Project selection persistence checkpoint

- Matched Jarvis `projectmanagement.lastProject` behavior in the target
  project-management page.
- Only the selected collection/project key is persisted in browser storage;
  credentials, session tokens and TFS response data are not persisted.
- Persistence failure is non-blocking and does not prevent TFS data loading.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Navigation icon parity checkpoint

- Replaced target navigation Unicode glyphs with inline SVG icons aligned to the
  trusted Jarvis navigation for Dashboard, project management, project tasks and
  profile.
- Changed presentation only; routes, permissions and business behavior are
  unchanged.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Dashboard UI compatibility checkpoint

- Reworked the target Dashboard shell toward the trusted Jarvis layout: greeting,
  four management stat cards and activity/announcement widgets.
- Employee, project, revenue and pending values use the approved dashboard read
  model when available; otherwise the UI shows an explicit unavailable state and
  never fabricates metrics.
- Kept the technical platform/session status section visible for the migration
  pilot and added responsive behavior for the new dashboard cards.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Profile UI compatibility checkpoint

- Reworked the target profile page to follow Jarvis `employees-info`: page title,
  avatar/sidebar summary, account information card and profile tabs.
- Kept profile data limited to the authenticated target-session contract; fields
  without an approved profile API remain explicit unavailable/read-only states.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Wiki and announcements UI compatibility checkpoint

- Added React routes `/wiki` and `/announcements` using the Jarvis source toolbar,
  filters, table columns, read-only detail modal and empty/loading/error states.
- Added legacy list adapters for `/api/v1/mt_wikis` and `/api/v1/mt_announcements`
  without changing the Jarvis repository or API.
- Target TFS sessions show the explicit API boundary; create/edit/delete controls
  remain disabled until target contracts and permissions are approved.
- Re-ran TypeScript strict, Vite production and .NET API builds successfully.

## 2026-08-13 — Content filter and AI-DLC contract checkpoint

- Matched source filter behavior for Wiki and announcements: category and
  level/priority reload the list, while full-text search is debounced.
- Added `construction/content-compatibility.md` with source mapping, target
  boundary and acceptance checks.
- Marked Wiki/documents/announcements as an in-progress construction unit in
  `aidlc-state.md`.
- Frontend test suite passed: 2 files and 6 tests; TypeScript, Vite and .NET
  builds also passed with zero errors.

## 2026-08-13 — Content adapter contract-test checkpoint

- Added contract coverage for filtered Wiki and announcements list requests,
  bearer propagation and empty-list responses.
- Frontend test suite now passes: 2 files and 8 tests.
- TypeScript strict, Vite production and .NET API builds remain green.
