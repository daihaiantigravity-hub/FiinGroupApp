# AI-DLC Audit Log

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
