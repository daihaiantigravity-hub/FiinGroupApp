# AI-DLC Audit Log

## 2026-08-18 - Local target-dev proxy recovery

- Diagnosed the reported 502: frontend had no `.env`, so Vite defaulted to
  legacy mode and proxied `/api` to unavailable `localhost:3000`.
- Added local-only `frontend/.env` with `VITE_AUTH_MODE=target-dev` and target
  proxy `localhost:5080`; restarted only the Vite process.
- Verified `/api/v2/auth/session` reaches Kestrel and returns expected 401
  without a session. No Jarvis file was modified.

## 2026-08-18 - Sidebar scrollbar detail

- Adjusted only the existing sidebar scroll presentation: removed reserved
  gutter, narrowed the thumb, made the track transparent and removed the corner
  rail/arrows. Navigation structure and project behavior are unchanged.
- Frontend 27/27 tests passed; Vite build passed.

## 2026-08-18 - Contract-field fixture coverage

- Extended only `project-management-target-fixture.sql` with synthetic contract,
  acceptance, warranty, maintenance, next-action and commission values.
- No Jarvis file or production/business data was modified.

## 2026-08-18 - Target project-list filter parity

- Re-read Jarvis project-list filter parameters and kept the target operation
  client-side over the existing authenticated project projection.
- Added project search, PM and status filters to the local workspace without
  creating API mutations or source-only joins.
- Frontend 27/27 tests passed; Vite build passed. Jarvis tracked diff remains
  clean.

## 2026-08-18 - Target project contract-field parity

- Re-read Jarvis `pm_project` definition and compared fields consumed by the
  target project/workspace reader.
- Added source-defined contract, warranty, maintenance, next-action, budget
  percentage, remarks and commission fields to the target DTO and UI.
- Backend 37/37 tests passed; frontend 27/27 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 - Target payment document metadata parity

- Re-read Jarvis payment-document GET route and the target projection created
  for migration 007.
- Added authenticated read-only document metadata API and expandable payment
  document panel. No attachment serving, upload or document mutation was
  enabled.
- Backend 37/37 tests passed; frontend 27/27 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 - Target commission read parity

- Re-read Jarvis `server/routes/pm-project-commissions.js` and the commission
  migration, including payment linkage and visible status fields.
- Added target migration 011, synthetic commission rows, authenticated
  read-only API and project workspace commission table. No commission
  calculation, payment or mutation was enabled.
- Backend 37/37 tests passed; frontend 26/26 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 - Target project requests read parity

- Re-read Jarvis `server/routes/pm-project-requests.js` and the
  `pm_project_requests` definition in `004_pm_project.sql`.
- Added target migration 010, synthetic request rows, authenticated read-only
  API and project workspace request table. Approval and all request mutations
  remain gated.
- Backend 37/37 tests passed; frontend 25/25 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 - Target PDCA read parity

- Re-read Jarvis `server/routes/pdca.js` and the `pm_project_pdca` definition
  in `004_pm_project.sql`.
- Added target migration 009, synthetic PDCA rows, authenticated read-only API
  and project workspace PDCA cards. No create/update/delete or HR user join was
  enabled.
- Backend 37/37 tests passed; frontend 24/24 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 - Target other project cost read parity

- Re-read Jarvis `server/routes/cost-other.js` and the
  `pm_project_cost_other` definition in `004_pm_project.sql`.
- Added target migration 008, synthetic cost rows, authenticated read-only API
  and a separate project workspace cost table. Encrypted member-cost, finance
  aggregation and all cost mutations remain outside the target slice.
- Backend 37/37 tests passed; frontend 23/23 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 - Target project payments read parity

- Re-read Jarvis `pm-projects/:projectId/payments` and the `004_pm_project.sql`
  payment/document definitions.
- Added target migration 007, synthetic fixture rows, authenticated read-only
  API and project workspace payment table. No payment/document mutation was
  enabled.
- Backend 37/37 tests passed; frontend 22/22 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 - Target resource workload read parity

- Re-read Jarvis `server/routes/project-tasks.js` workload route and preserved
  period filtering, overlapping task selection, assignee grouping and source
  counters in the target PM reader/API/UI.
- Added the authenticated read-only endpoint
  `/api/v2/project-management/workload` and resource allocation table with
  task drill-down. No assignment, task or Jarvis mutation was added.
- Backend 37/37 tests passed; frontend 21/21 tests passed; Vite build passed.
- No tracked source file under `FiinGroup.Jarvis` was modified.

## 2026-08-18 — Target weekly Summary read parity

- Re-read the trusted Jarvis `GET /summaries`, `/summary/:id`,
  `/summary-customers` and `/summary-projects` routes and the source Summary
  table/filter rendering.
- Added paged target read APIs for stored `pm_project_summary` rows, detail,
  customer options and project options, joined only to target `pm_project`
  metadata. No Jarvis/TFS mapping or Summary write route was added.
- Added the weekly Summary history table, source-aligned filters, pagination
  and project navigation to `/project-summary-local`.
- Backend isolated tests passed 37/37; frontend tests passed 19/19 and the
  production build succeeded. No files in `FiinGroup.Jarvis` were changed.
- Completed the existing detail contract in the UI: double-clicking a weekly
  Summary row loads `/summaries/{summaryId}` and shows Plan/Actual, dates,
  section, status, notes, resources and target project metadata read-only.
- Added the source-aligned same-week `section_type=2` to progress preview for
  unmaterialized projects. The synthetic fixture row 69904 validates this
  branch; no summary row is created by the UI.

## 2026-08-18 — Target task export read parity

- Re-read Jarvis `GET /api/project-tasks/export/:projectId` and its CSV/JSON
  field mapping.
- Added target CSV/JSON export over the existing target workspace projection
  and added read-only export buttons to the PM workspace. Import/template and
  all task mutations remain gated.
- Backend isolated tests passed 37/37; frontend tests passed 20/20 and the
  production build succeeded. No files in `FiinGroup.Jarvis` were changed.

## 2026-08-18 — Target Gantt read parity

- Re-read the source `GET /api/project-tasks/gantt/:id_project` query and
  Gantt rendering in `pages/projects/project-tasks.js`/`.html`.
- Added `GET /api/v2/project-management/projects/{projectId}/gantt` over the
  existing target project/task/assignee/dependency read model.
- Added the target Gantt view with hierarchy, padded date timeline, progress
  fill, status/overdue colors, milestone bars and dependency listing. Selecting
  a task opens the existing read-only detail; no task mutation was added.
- Resource Workload remains gated because source `users` and `hr_holiday`
  tables have no approved target mapping. Backend isolated tests passed
  35/35; frontend tests passed 18/18 and the production build succeeded.
  No files in `FiinGroup.Jarvis` were changed.

## 2026-08-17 — Target collaboration read parity

- Re-read the trusted Jarvis collaboration migrations `013_task_comments_attachments.sql`
  and `015_task_activity_log.sql`, plus the corresponding GET routes in
  `server/routes/project-tasks.js` and task-detail rendering in
  `pages/projects/project-tasks.js`.
- Added target migration `006_project_management_collaboration_read` and a
  repeatable synthetic fixture with comments, a reply, attachment metadata and
  activity entries for `FIXTURE-PM-001`.
- Added read-only target APIs and UI panels for task comments/replies,
  attachments, task activity and paged project activity. No POST/PUT/DELETE,
  upload, user-directory join or Jarvis/TFS mutation was added.
- Backend isolated tests passed 34/34; frontend tests passed 17/17 and the
  production build succeeded. Migration 006 and the fixture were applied to
  the local target database; no files in `FiinGroup.Jarvis` were changed.

## 2026-08-17 — Target Baseline read parity

- Re-read the source baseline schema and list/compare queries in
  `FiinGroup.Jarvis/server/migrations/014_task_baseline.sql` and
  `server/routes/project-tasks.js`.
- Added target migration `005_project_management_baseline_read`, manifest
  checksum and a repeatable synthetic baseline fixture for `FIXTURE-PM-001`.
- Added read-only target list/compare endpoints, including source-compatible
  `DATEDIFF` variances and the five summary metrics; no baseline mutation or
  Jarvis/TFS mapping was added.
- Added the baseline selector/comparison panel to `/projectmanagement-local`.
  Backend isolated tests passed 32/32; frontend tests passed 16/16 and the
  production build succeeded. The target local database applied migration 005
  and contains three synthetic baseline rows; no files in `FiinGroup.Jarvis`
  were changed.

## 2026-08-17 — Target WBS Critical Path read parity

- Re-read the source Critical Path route and its UI summary in
  `FiinGroup.Jarvis/server/routes/project-tasks.js` and
  `pages/projects/project-tasks.js`.
- Added the target read-only Critical Path endpoint and ported the source
  forward/backward pass over target tasks and dependencies.
- Added the source-style project-duration/path summary to the target PM
  screen; no `is_critical` persistence, TFS write or Jarvis mutation was added.
- Added calculator coverage for chained dependencies and the zero-duration
  fallback. Backend tests passed 30/30; frontend tests passed 15/15 and the
  production build succeeded.

## 2026-08-17 — PMBOK sheet navigation parity

- Re-read the source `PM_SHEETS`, `renderSheetBar`, `updateSheetDots` and
  `activateSheet` behavior in `pages/projects/projectmanagement.js`, plus the
  matching source tab CSS.
- Added the source-aligned eight-sheet PMBOK read-only tab bar to
  `LocalProjectManagementPmbok`; the existing target PM Flow and WBS sections
  represent source `Tổng quan` and `WBS` respectively.
- Reused target `buildFlow` statuses for the tab dots and kept all existing
  target DTO fields/panels; no source editor or mutation was added.
- Frontend tests passed 15/15 and the production build succeeded; no files in
  `FiinGroup.Jarvis` were changed. The current backend test project also passed
  28/28.

## 2026-08-17 — Target PMBOK read slice

- Re-read the trusted source migrations `090`–`094` and the PMBOK route
  queries for charter, stakeholder, resource/RACI, risk, cost, quality/DoD,
  communication and change data.
- Added target migration `004_project_management_pmbok_core` and its checksum
  manifest entry without changing migration `003` or any Jarvis file.
- Added the independently gated read-only PMBOK endpoint and on-demand UI
  panels with explicit schema-unavailable behavior when migration `004` is not
  present.
- Added a separate synthetic PMBOK fixture; it does not import source data,
  create TFS mappings or enable business mutations/approval workflows.
- Target backend isolated build passed with 0 warnings and 0 errors; frontend
  tests/build passed 13/13 and production build succeeded.

## 2026-08-17 — Target PM core workspace read slice

- Revalidated the target `003_project_management_core` schema against the
  source PM table inventory and extended the repository contract to read the
  seven target core tables in one project workspace.
- Added `GET /api/v2/project-management/projects/{projectId}/workspace` with
  the existing authenticated PM read permission and explicit not-found/query
  error codes.
- Added a separate `/projectmanagement-local` read-only UI for WBS,
  assignees, dependencies, task field history, weekly plans and summaries.
- Added a manually applied, target-only synthetic fixture marked
  `FIXTURE-PM-*`; it does not alter Jarvis, TFS or the approved mapping boundary.
- Kept PMBOK, baseline, comments, attachments, activity log and all business
  mutations gated because their target schema/mapping/permission decisions are
  still absent.
- Frontend tests/build passed; isolated backend build passed with 0 warnings and
  0 errors; existing backend tests passed 40/40.

## 2026-08-17 — Project-management TFS detail hardening

- Added a pure permission helper and tests for the target API's ACCESS + ADD/EDIT rule.
- Kept unavailable PMBOK sheets clickable so they show the explicit migration boundary.
- Added a visible work-item detail loading state and guarded edit attempts without EDIT permission.
- Preserved 404 responses for missing TFS projects and work items so the API can return specific not-found error codes.
- Frontend tests/build and the existing 40 backend tests passed; no files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — TFS Work Item Type discovery checkpoint

- Added read-only `GET /api/v2/tfs/projects/{projectId}/work-item-types` based on the source Jarvis TFS client contract.
- The create/edit task modal now loads available Work Item Types from the selected TFS project instead of assuming `Task` is always available.
- The backend still validates the effective TFS type during creation; no Jarvis DB dependency or mutation was added by this slice.
- Frontend production build passed with the Node 20 toolchain. Backend verification is pending while the active API/build processes hold the workspace.

## 2026-08-14 — Jarvis backend and schema reverse-engineering checkpoint

- Read the trusted Jarvis `project-tasks`, `pm-flow` and TFS synchronization source modules.
- Read the project/task, relation, audit, baseline, weekly-plan, charter and TFS-mapping migrations.
- Recorded route responsibilities, table ownership, revision conflict behavior and soft-delete semantics in `inception/reverse-engineering/jarvis-project-backend-baseline.md`.
- Added `construction/project-management-data-boundary.md` to separate the currently approved TFS read projection from the not-yet-approved Jarvis business database migration.
- No source files, migrations or runtime data in `FiinGroup.Jarvis` were modified.
- Further business-database implementation is blocked until a read-only Jarvis DB clone/access and project mapping authority are available.

## 2026-08-14 — Jarvis task-progress workflow checkpoint

- Confirmed from `project-tasks.js` and `tfs-work-item-sync.js` that progress updates derive local status, write task/audit logs and conditionally update TFS work fields.
- Recorded the exact workflow and the current target gap in the backend baseline and project-management data boundary documents.
- Did not add a target progress mutation because the required Jarvis business tables and TFS-to-Jarvis mapping are not available.

## 2026-08-14 — Project-management sheet/API parity checkpoint

- Read the source `projectmanagement.js` API calls for overview, charter, stakeholder, resource/RACI, cost, risk, quality, communication and change log.
- Added the route parity matrix and migration order to `construction/project-management-route-parity.md`.
- Kept all PMBOK sheets outside the target API because their source data and write permissions are not available.

## 2026-08-14 — TFS write-boundary contract tests

- Added backend tests proving TFS create/update requests fail with `TFS_WRITE_DISABLED` and HTTP 403 before any network call when the feature flag is off.
- Backend test suite passed: 18 tests; frontend test suite passed: 8 tests.

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

## 2026-08-14 — Project-management interaction parity checkpoint

- Added source-aligned reset behavior when the project select returns to its
  empty option, including clearing TFS data and the persisted management
  project selection.
- Added click-outside and Escape handling for the Công cụ popover and all
  read-only migration boundary/work-item dialogs.
- Added source-like feedback for unavailable PM sheets, Resource, mutation,
  baseline, history and import/export actions without creating write APIs or
  fabricated data.
- Added table scroll-edge state so the left/right buttons reflect the actual
  horizontal scroll position.
- Verified frontend TypeScript build, production Vite build, 8 frontend tests
  and `git diff --check`; no files in `FiinGroup.Jarvis` were modified.

## 2026-08-14 — Jarvis PM database comparison gate

- Verified the existing Jarvis MySQL tunnel with a read-only connection; no
  credentials were copied into `FiinGroupApp` or committed.
- The current database snapshot has zero `pm_project` rows, zero optional
  PMBOK tables used by `pm-flow`, one task row and three Redmine project rows.
- Because there is no source project record to map to the selected TFS
  projects, the target does not enable source editor save/delete behavior or
  fabricate PM flow data. The target remains TFS read-only with explicit
  boundary popups until an approved mapping/data snapshot is supplied.

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

## 2026-08-13 — Content navigation and dashboard cleanup checkpoint

- Moved Wiki and announcements into a dedicated `Nội dung` navigation group,
  matching the source information architecture more closely.
- Removed the duplicate legacy dashboard KPI strip so the new Jarvis-aligned
  four-card KPI row is the single source of displayed dashboard metrics.
- Added `frontend/.env.example` and documented legacy/target proxy mode setup.
- Frontend test suite remains green: 2 files and 8 tests; TypeScript, Vite and
  .NET builds passed with zero errors.

## 2026-08-13 — Standalone documents source-boundary checkpoint

- Re-checked `FiinGroup.Jarvis/pages/documents/documents.html`; the source
  module is explicitly `[WIP]` and has no data/API contract.
- Added target route `/documents` with the same WIP presentation and no API
  call, CRUD, fabricated data or Chatbot-document behavior.
- Recorded the boundary in `construction/content-compatibility.md` and kept
  `FiinGroup.Jarvis` unchanged.

## 2026-08-13 — Application shell source-alignment checkpoint

- Compared the Jarvis sidebar behavior: collapsed by default and persisted in
  `localStorage` under `sidebarCollapsed`.
- Added the same collapse/expand behavior to the React shell, including a
  responsive mobile override; no new business route or API was introduced.
- Frontend tests passed: 2 files and 8 tests; TypeScript and Vite production
  build passed with zero errors.

## 2026-08-13 - UI/backend review correction checkpoint

- Removed target-only dashboard platform cards and kept the dashboard shape
  aligned with `FiinGroup.Jarvis/pages/dashboard/dashboard.html`.
- Changed the shell identity to the source JARVIS identity and source favicon;
  no new business routes were added.
- Added form-level read permission checks to the target TFS read endpoints.
- Preserved TFS 4xx status codes, disabled NTLM auto-redirects and gated
  Swagger to Development.
- Added `generatedFields` provenance to TFS work-item projections for fallback
  dates, inferred progress and inferred plan.
- Frontend production build and temporary-output .NET build passed. Backend
  test execution still needs a clean output run because the active API process
  locks the normal build output.

## 2026-08-13 - TFS pilot read permission checkpoint

- Added the explicit `backend.PermissionProvisioner` tool for the separate
  identity store.
- It creates/reuses `TFS_READONLY` and grants only `ACCESS` and `VIEW` for
  `pm-projects`, `projectmanagement` and `project-tasks`.
- It never creates users, changes external identity mappings, grants mutation
  permissions or runs during API startup.
- Added the technical-pilot runbook and built the provisioner successfully.
- Executed the provisioner for `technical.user` against the running disposable
  identity database; verification showed the expected read-only TFS permissions.

## 2026-08-14 — Jarvis development environment verification

- Confirmed that the running Jarvis development loader uses `.env.development`
  with the same database target used in the read-only comparison.
- Did not run the legacy TFS-to-Jarvis synchronization script because it writes
  to the trusted source database and is outside the approved migration scope.

## 2026-08-14 — Project task summary stats UI parity

- Replaced target summary-stat text glyphs with the exact five inline SVG icon
  structures and source labels from `pages/projects/project-tasks.html`.
- Aligned card flex layout, spacing, gradients, success border, typography and
  hover transition with `pages/projects/project-tasks.css`.
- Kept the source behavior: stats remain hidden until a project is selected and
  TFS work items are loaded.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Source-screen label correction

- Removed the remaining `TFS Projects` wording from the migrated project
  screens; their visible titles now remain `Quản lý dự án` and `Tiến độ dự án`,
  matching the Jarvis source navigation.
- TFS is treated as the read-only data source inside those source screens, not
  as a new user-facing module.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Project task Gantt/list toggle correction

- Replaced the target text-button view switch with the source-equivalent
  controlled radio/label interaction and source SVG icons.
- Verified the `list -> gantt -> list` state path at compile/test level.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Project task toolbar icon parity

- Replaced target text glyphs for Resource, Công cụ and Thêm Task with the
  corresponding source SVG structures.
- Preserved the existing read-only boundaries and click behavior.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Project task tools popover icon parity

- Added source-equivalent SVG icons and flex alignment to the existing Công cụ
  popover entries: sync, critical path, baseline, history, export/import and
  refresh.
- Kept every unavailable command as a read-only boundary popup; no mutation
  endpoint was introduced.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Identity-store diagnostic correction

- Added safe backend logging for MySQL identity-resolution failures.
- Added non-secret error categories for access denied, missing database and
  missing schema while retaining the generic unavailable response for other
  failures.
- Verified the backend builds successfully with the API process output isolated
  from the active runtime output.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Application-shell tab interaction correction

- Replaced the nested close-button-inside-link structure with separate tab
  navigation and close controls.
- Preserved the Jarvis-aligned visual state while preventing a close click from
  triggering navigation or losing the remaining open tabs.
- Verified frontend tests and production build after the change.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — TFS project selection race correction

- Invalidated stale project/data/detail requests when the selected TFS project
  changes, preventing an earlier response from overwriting the current project.
- Reset detail loading state when clearing or changing projects so Work Item
  detail remains usable after a fast project switch.
- Verified frontend tests, frontend production build and isolated backend build.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Open-tab state preservation checkpoint

- Kept all opened target pages mounted and hid only the inactive page, so
  project selection, filters, Gantt mode and loaded read-only data survive tab
  switching.
- Kept the Dashboard tab pinned and retained the existing per-user open-tab
  storage and close behavior.
- Verified frontend tests, backend tests and frontend production build.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Open-tab horizontal scrolling checkpoint

- Added source-aligned left/right tab scrolling controls for long tab lists.
- Tab overflow is contained in the top bar; hover and disabled states are
  explicit and the controls update on resize and horizontal scroll.
- Verified frontend tests, backend tests and frontend production build.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Open-tab context menu checkpoint

- Added source-aligned context actions for the open-tab bar: close current,
  left, right, other and all non-pinned tabs.
- Disabled destructive tab actions when there is no applicable target and kept
  Dashboard pinned.
- Escape and outside click close the context menu without touching business
  data.
- Verified frontend tests, backend tests and frontend production build.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — TFS read-only route discoverability checkpoint

- Added the existing `/projects` TFS browser route to the Dự án menu.
- This exposes collections, projects, Teams, Iterations and Work Items through
  the already-authorized read-only target API; no new endpoint or permission
  bypass was added.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Active-tab restoration checkpoint

- Persisted the active route per authenticated user under the same tab-manager
  convention as Jarvis.
- On a root refresh, restored the last valid active target tab; invalid routes
  still fall back to Dashboard.
- Verified frontend tests and production build.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Tab manager interaction parity checkpoint

- Added middle-click close and drag-and-drop tab reordering to match the
  existing Jarvis tab manager behavior.
- Dashboard remains pinned and cannot be dragged; reordered tabs are persisted
  per user with the existing open-tab storage.
- No business data or API contract was changed.
- No files under `FiinGroup.Jarvis` were changed.

## 2026-08-14 — Correction: remove non-source TFS Projects navigation

- Review confirmed that `FiinGroup.Jarvis` does not expose a `TFS Projects`
  item in its main navigation.
- Removed the target-only `/projects` route, tab label and sidebar entry from
  FiinGroupApp. Project data remains available only through the source-aligned
  `Quản lý dự án` and `Tiến độ dự án` screens.
- The existing `/api/v2/tfs/projects...` endpoints remain internal data
  adapters used by those two migrated screens; no new navigation surface is
  exposed.
- No files under `FiinGroup.Jarvis` were changed.
## 2026-08-14 — Jarvis PM schema and local fixture checkpoint

- Đã đối chiếu schema source cho `pm_project`, `pm_project_task`,
  `pm_task_assignee`, `pm_task_dependency`, `pm_task_log`, `pm_task_plan` và
  `pm_project_summary` từ migrations Jarvis.
- Đã xác nhận bootstrap SQL của Jarvis là fixture TEST/DEVELOPMENT; file restore
  project chứa dữ liệu nghiệp vụ tĩnh và không được copy vào target.
- Thêm `docs/project-management-fixture.md` và SQL fixture local-only với dữ liệu
  synthetic để kiểm thử cấu trúc project/WBS/assignee/dependency.
- Fixture không được API tự động chạy, không chứa identity/credential và không mở
  thêm quyền ghi business data.
## 2026-08-14 — TFS detail modal wording correction

- Sửa nhãn ở popup chi tiết work item để không còn khẳng định toàn bộ màn hình là
  read-only trong khi create/edit TFS đang được feature-flag và permission-gate.
- Không thay đổi API, schema hoặc logic business; xóa/progress/baseline và các
  thao tác cần Jarvis DB vẫn giữ nguyên boundary.

## 2026-08-14 — TFS validation test checkpoint

- Bổ sung test cho work-item detail ID không hợp lệ, revision không hợp lệ và
  update rỗng; các trường hợp này phải bị chặn trước network call.
- Frontend build/test vẫn đạt ở checkpoint này.
- Backend test chưa thể xác nhận: binary `--no-build` là binary cũ gây
  `TypeLoadException`, còn build/test output riêng bị treo quá timeout trong khi
  tiến trình API đang chạy. Không dừng tiến trình API của người dùng.
## 2026-08-14 — Full migration inventory checkpoint

- Đã kiểm kê source Jarvis: khoảng 88 HTML, 353 JavaScript, 81 CSS, 106 SQL và
  hàng chục Express route.
- Đã lập migration map theo batch trong `docs/full-migration-map.md`.
- Xác nhận các batch PMBOK, HR, salary/accounting, chatbot và workers cần
  business database/external contract; không tạo UI hoặc backend giả để thay thế.
## 2026-08-14 — Business database connectivity gate

- Đã kiểm tra read-only TCP từ môi trường hiện tại: `127.0.0.1:3307` và
  `127.0.0.1:3306` đều không kết nối được.
- Không truy cập hoặc thử credential vào database Jarvis khi tunnel/database
  chưa sẵn sàng.
- Tiến trình FiinGroupApp API vẫn đang chạy và giữ backend DLL; không tự ý dừng
  tiến trình của người dùng.
- Các batch business UI/backend tiếp theo chờ database clone/read-only và môi
  trường build được giải phóng.
## 2026-08-14 — Project-management schema migration checkpoint

- Thêm migration target-only `003_project_management_core` dựa trên schema
  Jarvis cho project, WBS, assignee, dependency, log, weekly plan và summary.
- Tách manifest khỏi Identity DB; migrator chỉ cho phép hai database target đã
  allow-list và bắt buộc `--confirm-database` phải khớp connection database.
- Không seed dữ liệu, không copy `006_restore_pm_project_data.sql`, không tạo
  mapping TFS/Jarvis và không chạy migration lúc API startup.
- Runbook được ghi tại `docs/project-management-migration-runbook.md`.
## 2026-08-14 — Project-management .NET read contract checkpoint

- Thêm `ProjectManagementOptions`, DTO và `MySqlProjectManagementReader` cho
  read contract project/task dựa trên schema Jarvis.
- Thêm hai endpoint `/api/v2/project-management/projects` và
  `/api/v2/project-management/projects/{id}/tasks` với permission read và error
  envelope riêng.
- Mặc định business store bị tắt; không có connection string thì không mở DB.
- Chưa nối UI/TFS selector vì mapping `pm_project.id_project` ↔ TFS GUID chưa
  được phê duyệt.
## 2026-08-14 — Project-management React client checkpoint

- Thêm typed client React cho hai API PM business read contract.
- Thêm test kiểm tra URL, credentials cookie và giữ nguyên error code từ backend.
- Chưa gắn client vào TFS UI vì chưa có mapping được phê duyệt giữa PM project
  numeric ID và TFS project GUID.
## 2026-08-14 — Project-management health checkpoint

- Thêm health check `project-management-store` cho database PM riêng.
- Khi tắt, health check không mở database; khi bật, kiểm tra connection bằng
  query an toàn `SELECT 1` và không ghi log connection string.

## 2026-08-17 — Target Task Plan read slice

- Đối chiếu `pages/projects/task-plan-list.html`, `task-plan-list.js`,
  `task-plan.html`, `task-plan.js` và route `server/routes/task-plans.js` của
  Jarvis để giữ đúng các trường tuần, project, nội dung, Plan/Actual, kết quả,
  nguồn lực và trạng thái.
- Thêm API target read-only có phân trang/bộ lọc cho `pm_task_plan`, cùng hai
  màn `/task-plan-list-local` và `/task-plan-local`; các màn này dùng rõ nhãn
  target/synthetic và liên kết về workspace project đích.
- Không bật save-batch, delete, inherited-plan, approval, TFS sync hoặc gọi
  API Jarvis; không coi `pm_task_plan.id_project` là TFS GUID.
- Bổ sung test client, test reader khi store bị tắt; frontend 14/14, backend
  test build/run 27/27, backend build 0 warning/0 error.
- Không có file nào trong `FiinGroup.Jarvis` bị sửa.

## 2026-08-17 — Target PM database bootstrap checkpoint

- Tạo database local `FiinGroupApp.ProjectManagement`, áp dụng migration `003`
  và optional migration `004` bằng `backend.DatabaseMigrator` với database
  confirmation bắt buộc.
- Nạp thành công core fixture và PMBOK fixture target-only. Kiểm tra hiện tại:
  2 project, 4 task, 3 Task Plan, 3 summary, 1 charter, 2 risk và 2 quality plan.
- Sửa fixture core: bổ sung `source_url` và căn lại thứ tự source fields để
  không vi phạm unique key `uk_task_external_source`.
- Không đọc/ghi database nghiệp vụ Jarvis và không thay đổi credential trong
  repository.

## 2026-08-17 — Target Task Plan detail checkpoint

- Bổ sung `source_plan_id` và `created_at` vào target Task Plan DTO/query để
  giữ lineage và metadata có sẵn trong schema.
- Bổ sung chọn dòng bằng chuột/bàn phím và panel detail trong cả danh sách và
  màn tuần; vẫn giữ liên kết về workspace project và boundary read-only.
- Không tái tạo previous-week inheritance, save, delete, approval hoặc các
  mutation của `server/routes/task-plans.js` vì target chưa mở unit dữ liệu ghi.
- Frontend 15/15 test, frontend build thành công; backend 28/28 test, build
  0 warning/0 error.
- Không có file nào trong `FiinGroup.Jarvis` bị sửa.
## 2026-08-17 — Target project summary read slice

- Đối chiếu `server/routes/pm-flow.js` và `server/routes/project-tasks.js`
  (`/summaries`) của Jarvis để giữ các chỉ số project/WBS, quá hạn,
  dependency, Plan/Actual tuần và budget ở mức target có dữ liệu.
- Thêm `GET /api/v2/project-management/summary` và màn
  `/project-summary-local` với bộ lọc khách hàng/PM/tình trạng, sắp xếp và link
  sang workspace hoặc Task Plan.
- Không suy diễn earned value Redmine, cost cache, HR/finance, PMBOK chưa có
  dữ liệu; không gọi API Jarvis và không thêm mutation.
- Bổ sung test reader khi store bị tắt; frontend 15/15, backend test build/run
  28/28, backend build 0 warning/0 error.
- Không có file nào trong `FiinGroup.Jarvis` bị sửa.

## 2026-08-17 — Target Task Plan inheritance preview

- Đối chiếu logic source `server/routes/task-plans.js` và `pages/projects/task-plan.js`:
  tuần hiện tại có thể hiển thị Next Plan tuần trước như Weekly progress nếu
  chưa có dòng materialized tương ứng.
- Bổ sung target read-only preview bằng hai truy vấn target; dùng
  `source_plan_id` để loại trùng và gắn nhãn `Kế thừa`. Không tạo bản ghi, không
  bật save-batch, delete, approval hoặc mutation.
- Frontend 15/15 test và build thành công; không có file nào trong
  `FiinGroup.Jarvis` bị sửa.

## 2026-08-17 — Target Task Plan week navigation checkpoint

- Bổ sung điều hướng tuần trước/tuần sau, nút về tuần hiện tại và khoảng ngày
  ISO Monday–Sunday trên `/task-plan-local`.
- Tách rõ `Weekly progress` và `Next plan` theo từng project, giữ badge dòng
  `Kế thừa` và panel detail hiện có.
- Các control chỉ thay đổi query read-only; không bật save, delete hoặc mutation.
- Frontend 15/15 test và build thành công; không có file nào trong
  `FiinGroup.Jarvis` bị sửa.

## 2026-08-17 — Target PM Flow read slice

- Đối chiếu source `server/routes/pm-flow.js` để giữ đủ 11 bước: Charter,
  Stakeholder, WBS, Schedule, Resource/RACI, Cost, Risk, Quality,
  Communication, Change Log và Dashboard.
- Thêm flow read-only vào `/projectmanagement-local`; WBS/schedule/dashboard
  dùng workspace target, các bước PMBOK dùng endpoint PMBOK target khi người dùng
  chọn mở. Trạng thái chưa tải không bị suy diễn thành đã thiết lập.
- Không tự tạo earned-value Redmine, cost cache, HR/finance, meeting hoặc
  mapping TFS; PM Flow vẫn read-only và không có mutation.
- Sửa truy vấn summary target để dependency không nhân đôi task count,
  completed/active/overdue count hoặc average progress.
- Frontend build thành công sau batch; test/build đầy đủ được chạy lại ở
  checkpoint bàn giao.
- Không có file nào trong `FiinGroup.Jarvis` bị sửa.

## 2026-08-18 — PM local UI and logic parity correction

- Rà soát lại `projectmanagement.html`, `projectmanagement.js` và
  `server/routes/pm-flow.js` của Jarvis làm nguồn hành vi; giữ shell đích
  read-only và không sửa file trong `FiinGroup.Jarvis`.
- Sửa màn `/projectmanagement-local` về cấu trúc source: một project selector,
  sheet tabs, dot trạng thái theo flow, summary KPI và flow dọc; loại bỏ toolbar
  lọc/banner/selector ẩn làm lệch UI và điều hướng sheet khi chọn bước.
- Căn lại logic Charter proxy, Stakeholder completeness, tiến độ Schedule và
  Cost theo contingency/budget; khôi phục nhãn tiếng Việt bị lỗi mã hóa ở flow,
  PMBOK, project summary và Task Plan.
- Không thêm mutation, TFS/Jarvis mapping hoặc suy diễn dữ liệu PMBOK chưa tải.
- Frontend test 32/32 và production build thành công; kiểm tra trình duyệt local
  không thực hiện được do browser runtime bị chặn dependency nội bộ `spawn EPERM`.

## 2026-08-18 — PM source parity follow-up

- Căn lại `setup_percent` theo đúng mẫu số của source: toàn bộ setup section
  được tính, section chưa có dữ liệu đóng góp 0 thay vì bị loại khỏi mẫu số.
- Ẩn progress bar ở section `na`, bỏ PMBOK tab lồng không có trong UI source,
  và giữ sheet bar trên cùng làm điểm điều hướng duy nhất; rail, chip MVP và
  vị trí nút `Mở →` cũng được đưa về cùng bố cục flow source.
- Bổ sung tổng mandays kế hoạch vào Resource/RACI flow và đưa scroll khi đổi
  sheet về root PM như hành vi `activateSheet` của Jarvis.

## 2026-08-18 — WBS/Gantt and summary interaction parity

- Căn lại Gantt target với project-tasks source: đồng bộ cuộn header/thân,
  hiển thị đường ngày hiện tại, dependency connectors và task summary/milestone.
- Thay listener DOM thủ công ở lịch sử Project Summary bằng event React có
  hỗ trợ Enter/Space để mở detail read-only ổn định sau lọc và phân trang.
- Giữ nguyên ranh giới target read-only; không bổ sung thao tác save/delete/sync.

## 2026-08-18 — PM sheet navigation follow-up

- Căn `Schedule & Gantt` flow action về sheet WBS giống source `edit: 'wbs'`;
  không mở nhầm PMBOK khi người dùng bấm `Mở →`.
- Loại toolbar PMBOK phụ khỏi sheet view; trạng thái loading/error được hiển
  thị inline để sheet bar chính là điểm điều hướng duy nhất.

## 2026-08-18 — PM Flow legend parity

- Bổ sung legend trạng thái ở cuối Overview, gồm Done/Đang làm/Chưa bắt đầu/
  Tự động/Chưa tải PMBOK và giải thích màu rail setup/auto/MVP như source.

## 2026-08-18 — PM project selection persistence

- Đồng bộ hành vi selector với `projectmanagement.js`: ưu tiên `projectId` trên
  URL, sau đó khôi phục project cuối từ `localStorage`, rồi mới fallback về
  project hiện tại hoặc project đầu tiên; lựa chọn mới cũng được lưu lại.

## 2026-08-18 — Task Plan list parity

- Căn mặc định Task Plan về Weekly Progress, tuần hiện tại và trạng thái hiệu
  lực như source; vẫn cho phép người dùng đổi bộ lọc sang các loại khác.
- Bổ sung sort theo cột ở target list và truyền sort/order xuống API với whitelist
  SQL, giữ đúng thứ tự khi phân trang thay vì chỉ sort phần dữ liệu đang tải.

## 2026-08-18 — Gantt interaction parity

- Đồng bộ cuộn hai chiều giữa header và thân Gantt để kéo timeline ở khu vực
  nào cũng giữ đúng cột ngày.
- Không tô progress fill hoặc label tên lên summary/milestone, khớp cách source
  hiển thị hai loại task đặc biệt.

## 2026-08-18 — Project selector initial state parity

- Khi không có `projectId` trên URL hoặc project đã lưu, selector giữ trạng thái
  “Chọn dự án” như Jarvis thay vì tự mở project đầu tiên và tải nhầm workspace.
- Bổ sung empty state tương ứng để vùng nội dung không bị trống sau khi bỏ
  auto-select.

## 2026-08-18 — PMBOK loading deduplication

- Loại bỏ lời gọi `loadPmbok` trùng từ Flow action; điều hướng sheet của parent
  là nơi duy nhất tải PMBOK khi người dùng mở một bước chưa có dữ liệu.

## 2026-08-18 — Project loader race protection

- Các loader PMBOK, WBS analysis, Gantt, baseline, activity, workload, payment,
  cost, PDCA, request, commission, document và export chỉ commit response nếu
  project trả về vẫn là project đang chọn, tránh stale response ghi đè workspace.

## 2026-08-18 — Jarvis visual token parity

- Gắn visual contract và token `--q-*` của source cho `.local-pm-page`, đồng thời
  dùng class `projectmanagement` trên PM workspace React; các border, màu chữ,
  nền và kích thước sheet/flow nay dùng cùng nền tảng CSS với Jarvis.

## 2026-08-18 — PMBOK nested tab parity

- Khôi phục các tab con Resource/RACI, Quality/Definition of Done và Change
  requests/nguồn tự động theo markup source; panel chỉ hiển thị pane đang chọn,
  không còn dồn hai nội dung cạnh nhau như bản target cũ.

## 2026-08-18 — PM Flow action parity

- Hiển thị trạng thái `Sắp có` cho bước chưa có điều hướng, thay vì bỏ trống
  vùng action như bản React trước đó.

## 2026-08-18 — WBS task grid and sheet view parity

- Đưa WBS về cấu trúc task grid của `project-tasks`: 13 cột, sticky STT/thao
  tác, priority dot/badge, avatar assignee và progress Actual/Plan riêng.
- Bổ sung chuyển chế độ `Danh sách`/`Gantt` ngay trong sheet WBS; nút Gantt
  không còn bị ẩn cùng nhóm analysis toolbar.
- Gantt có header hai tầng tháng/ngày, đồng bộ cuộn hai chiều và ẩn summary
  KPI khi rời sheet Tổng quan như controller `activateSheet` của Jarvis.
- WBS được hiển thị full-width giống task grid source; detail read-only chỉ
  nằm bên dưới khi người dùng chọn task, còn nhóm task có nút thu gọn/mở rộng
  theo quan hệ parent-child của WBS.

## 2026-08-18 — PMBOK/status parity follow-up

- Overview tự tải PMBOK workspace cùng lúc với workspace project để PM Flow có
  thể tính trạng thái đầy đủ như `pm-flow` của Jarvis; khi PMBOK chưa bật vẫn
  giữ proxy/`Chưa thiết lập`, không suy diễn dữ liệu nguồn.
- Charter map riêng `approval_status` (`2 = Đã duyệt`) thay vì dùng chung map
  decision của Change Log; khôi phục trường High risks và các cột Power/
  Interest/Owner của Stakeholder Register.
- WBS và Schedule chuyển sang `Chưa thiết lập` khi project không có
  `sourceProjectId`, tránh hiển thị tiến độ/Gantt giả cho project target-only.

## 2026-08-18 — Task Plan and project selector parity follow-up

- Weekly Task Plan chỉ kế thừa Next Plan của tuần trước khi tuần đang xem
  hoàn toàn không có dòng, đúng fallback của `task-plan.js`; không trộn dòng
  kế thừa vào tuần đã có Progress hoặc Next Plan.
- Project selector dùng cùng quy tắc label/sort của Jarvis: khách hàng →
  annex/project code → id, đồng bộ ở workspace PM, Task Plan và Summary.
- Bộ lọc PM của Task Plan target khớp cả `pm_project.pm` và `pm_task_plan.created_by`;
  trước đó các dòng do PM tạo cho project của PM khác bị bỏ sót.
- Summary map trạng thái theo `pm_project` của Jarvis (`-1/0/1/2/5/6`) và
  map riêng trạng thái bản ghi summary, không dùng nhầm status của task.
- Đồng bộ `projectId` trên URL khi route hiện tại đã mount, để mở project từ
  Summary/Task Plan không giữ lại workspace của project trước đó.

## 2026-08-18 — TFS project context và PM target navigation

- Nút `Mở PM đích` của trang `/projectmanagement` truyền `tfsProjectRef` của
  TFS project đang chọn; các tab PMBOK trước đây bị khóa nay mở sheet tương
  ứng trên target workspace khi đã có project target được chọn.
- PM target chỉ tự chọn theo `projectId` target; khi URL có external source
  context thì không fallback sang project lưu gần nhất. Nếu chưa có mapping,
  hiển thị thông báo rõ ràng thay vì mở nhầm project.
- Tách localStorage của TFS project (`projectmanagement.tfsProject`) và target
  project (`projectmanagement.targetProject`), tránh hai màn hình ghi đè lên
  nhau bằng hai định dạng ID khác nhau; vẫn đọc giá trị legacy hợp lệ.
- Các công cụ đã có read API target (workload, critical path, baseline,
  activity log và export) từ `/project-tasks` chuyển thẳng sang PM target với
  đúng context project nguồn và tự mở panel tương ứng; thao tác đồng bộ/ghi TFS
  vẫn giữ boundary notice vì chưa có contract ghi an toàn.

## 2026-08-18 — TFS/target mapping safety correction

- Không dùng TFS project ID như `pm_project.id_project`: hai namespace chưa
  được phê duyệt mapping trong migration contract. Context từ TFS nay truyền
  bằng `tfsProjectRef`/tên project để hiển thị và không tự chọn target project.
- Khi chưa có mapping, PM target giữ trạng thái chưa chọn và yêu cầu người dùng
  chọn target đã xác định; không fallback về project lưu gần nhất.
- Khi người dùng chọn target project trong context TFS, lựa chọn được lưu theo
  `collection/id` của TFS để lần mở sau dùng đúng mapping thủ công đó.
- PM target hiển thị banner context TFS với trạng thái `chưa mapping` hoặc
  `đã dùng mapping`, giúp người dùng phân biệt rõ project nguồn và target.

## 2026-08-18 — TFS task ADD capability correction

- Xác định lỗi `Tài khoản chưa được cấp quyền ADD cho task`: phiên đăng nhập
  TFS trước đây luôn nhận `PermissionSet` rỗng, nên React và API chặn trước khi
  gửi request tới TFS; quyền ADD thật của tài khoản trên TFS không được dùng.
- Phiên TFS nay nhận quyền đọc cho các form TFS và nhận capability ADD khi
  `Tfs:WriteEnabled=true`; với user đã mapping vào target, chỉ hợp nhất ADD
  trên form đã có ACCESS/VIEW, không mở rộng module ngoài boundary hiện hữu.
- POST tạo task vẫn gửi credential TFS của chính phiên đăng nhập; TFS là lớp
  quyết định cuối cùng nếu tài khoản không có quyền tạo trong project. Direct
  TFS session cũng được dùng cho EDIT qua update có revision guard; DELETE và
  ghi Jarvis DB vẫn bị khóa.
- Profile Development và launch profile local được bật `Tfs:WriteEnabled=true`
  để đúng với pilot tạo task hiện tại; môi trường khác vẫn phải cấu hình flag
  tường minh. Đã thêm backend regression tests cho read/ADD và mapped-user
  capability.

## 2026-08-18 — TFS NTLM proxy bypass

- Sau khi restart API, login TFS trả `TFS_UNAVAILABLE` vì process kế thừa
  `HTTP_PROXY/HTTPS_PROXY=http://127.0.0.1:9`; TFS nội bộ ở
  `192.168.1.40:8080` bị đẩy qua proxy không tồn tại.
- Xác nhận endpoint TFS truy cập trực tiếp trả `401` và
  `WWW-Authenticate: NTLM`, chứng minh network/TFS còn hoạt động; cấu hình
  `HttpClientHandler` của cả authentication và project reader nay bypass proxy
  để không gửi NTLM credential handshake qua proxy.

## 2026-08-18 — TFS task EDIT capability correction

- Đồng bộ capability EDIT cho phiên đăng nhập trực tiếp bằng TFS khi
  `Tfs:WriteEnabled=true`, và hợp nhất EDIT cho mapped user đã có ACCESS/VIEW
  trên form task; lỗi UI `Không có quyền sửa Task` không còn chặn trước khi
  gửi request hợp lệ.
- PUT update và TFS soft-remove đều dùng credential TFS với revision guard; TFS
  là lớp xác nhận cuối cùng về quyền sửa, còn xóa liên kết Jarvis DB và các
  mutation Jarvis khác vẫn bị khóa.

## 2026-08-18 — TFS task soft-delete parity

- Đối chiếu Jarvis `DELETE /api/project-tasks/:id`: source không hard-delete
  mà cập nhật task và TFS sang `Removed`, đồng thời soft-delete row local.
- Target bổ sung `DELETE /api/v2/tfs/projects/{projectId}/work-items/{id}`;
  endpoint chỉ chuyển `System.State` sang `Removed` bằng credential TFS và
  revision guard, không ghi Jarvis DB và không gọi hard-delete TFS.
- Danh sách work item target loại các item đã `Removed`; UI xác nhận rõ đây là
  xóa mềm trên TFS. Local/non-TFS target session vẫn không có nút mutation này.
