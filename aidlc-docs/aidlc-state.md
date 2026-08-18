# AI-DLC State

## Workspace

- Project: FiinGroupApp
- Type: Brownfield modernization target
- Legacy source: `D:\DEV\FiinGroup.Jarvis`
- Strategy: Incremental module migration
- Target: React + TypeScript + Vite and ASP.NET Core .NET 8

## Stage Progress

### INCEPTION

- [x] Workspace initialized
- [x] Legacy reverse-engineering artefacts imported as baseline
- [ ] Baseline revalidation
- [ ] Requirements Analysis
- [ ] User Stories
- [ ] Workflow Planning
- [ ] Application Design

### CONSTRUCTION

- [~] Application Platform — React shell, target API health, TFS pilot session and read-only platform dashboard implemented
- [~] Authentication and user profile — TFS target login plus in-memory pilot session/profile/permission contracts; persistent store and 2FA migration pending
- [~] Project Management / TFS + target PM read-only — source-aligned React layouts for `projectmanagement` and `project-tasks`, target core workspace, paged Task Plan views with read-only detail/lineage and previous-week inheritance preview, target project summary, target-only PM Flow, PMBOK workspace and baseline comparison; source Jarvis-backed PMBOK, summary/resource data, mapping and mutation remain gated
- [~] Wiki / documents / announcements — source-aligned React read-only routes with legacy list adapters; standalone `/documents` remains the source `[WIP]` boundary; target content API, permission mapping and mutations remain pending

## Migration decision

- Target WBS now includes a read-only Critical Path calculation over the
  existing task/dependency projection; persistence of `is_critical` remains
  gated.

- The target PMBOK read model now follows the source sheet navigation for its
  eight PMBOK data sheets; target PM Flow and WBS remain the parent sections.

- The target now exposes source-aligned baseline list/comparison reads over
  migration `005`; baseline creation, activation and deletion remain gated.

- The target now exposes read-only comments/replies, attachment metadata and
  project/task activity log reads over migration `006`; collaboration writes,
  uploads and target identity mapping remain gated.

- The target now exposes a read-only Gantt projection over the target task,
  assignee and dependency tables; Resource Workload remains gated until the
  source `users`/`hr_holiday` mapping is approved.

- The target now exposes the stored weekly Summary read slice with source
  filters, project metadata, detail reads and paged history; previous-week
  inheritance/materialization and all Summary writes remain gated.

- Legacy Jarvis is the trusted behavioral/source reference.
- FiinGroupApp owns the target implementation and future user/permission store.
- Migration is validated by source-to-target comparison artifacts and tests.
- Current source inventory refreshed on 2026-08-12; see `inception/reverse-engineering/current-baseline.md`.
- Authentication target remains behind the comparison/acceptance gate; see `construction/auth-contract-matrix.md`.
- TFS project-management UI comparison and migration boundary are documented in `construction/tfs-project-management-ui.md`.
- Jarvis project backend routes, tables and TFS synchronization behavior are documented in `inception/reverse-engineering/jarvis-project-backend-baseline.md`.
- The target business-database boundary and approval gates are documented in `construction/project-management-data-boundary.md`.
- The source project-management sheet/API parity matrix is documented in `construction/project-management-route-parity.md`.
- The full source-to-target module migration map is documented in `docs/full-migration-map.md`.
- Jarvis PM table mapping and the target-only synthetic local fixture are documented in `docs/project-management-fixture.md`.
- Wiki and announcements compatibility boundary is documented in `construction/content-compatibility.md`.
- UI/backend correction decisions are documented in `construction/ui-backend-review-correction.md`.
- TFS pilot permission provisioning is documented in `docs/tfs-permission-provisioning-runbook.md`.
- Current blocker: Jarvis business database is not fully accessible; only source-code/migration baseline and approved TFS read projection can be advanced safely.
- Target-only PM core, optional PMBOK reads and baseline comparison are
  available behind the separate `/projectmanagement-local` route and the
  explicit `ProjectManagement` store connection. They cover target-aligned
  read tables with optional synthetic fixtures; they do not change the
  Jarvis/TFS mapping or unblock baseline writes, comments, attachments,
  activity-log, approval or other mutations.

### OPERATIONS

- [~] Local startup runbook — `scripts/start-target-dev.ps1` now owns the
  repeatable target startup flow, port-5080 reuse/restart checks, and optional
  Vite startup. Credentials remain outside source control.
- [~] Runtime launcher now discovers local Identity-container settings and
  enables Identity and Project Management read stores without persisting
  credentials.
- [~] Project Management local selector now clears stale workspace state when
  search/PM/status filters exclude the selected project.
- [~] Task Plan PM filter now clears an incompatible project selection so
  customer/PM/project filters do not silently produce a false empty result.
- [~] Summary history filters now constrain the Project options by selected
  customer/PM and reset incompatible project selections.
- [~] Summary inheritance preview now clears its loading state when the
  required year/week filters are cleared during an in-flight request.
- [~] Project Management client errors now preserve Development `detail` and
  `errorId` alongside the existing error code.
- [~] Target authentication and dashboard client errors now preserve the same
  `detail`/`errorId` diagnostics across login, session restore and dashboard.
- [~] TFS project/team/iteration/work-item client errors now preserve
  Development `detail` and `errorId` diagnostics as well.
- [~] Backend unhandled exceptions now return a production-safe `errorId` and
  Development-only exception `detail`; the target runtime was restarted after
  the change.
- [~] TFS read/write permission denials now include an `errorId` while keeping
  the existing permission gates unchanged.
- [~] Project Management store errors now include an `errorId` while keeping
  the existing error codes and store gates unchanged.
- [~] Project Summary detail and payment-document metadata labels now render
  the source Vietnamese text correctly; this is display-only and preserves
  the existing read-only data and actions.
- [~] Task Plan list/week/detail surfaces now render the source Vietnamese
  labels correctly; filtering, inheritance preview and pagination are
  unchanged.
- [~] Removed the remaining replacement-character/mixed-encoding labels from
  Task Plan status and entry-type fallbacks; no runtime behavior changed.
- [~] PMBOK tabs now render the source Vietnamese labels correctly across
  Charter, stakeholder, resource, cost, risk, quality, communication and
  change-log read-only panels.
- [~] Audit confirmed the target PM slice remains read-only: all PM routes are
  GET-only, the PM client has no mutation method, and the PM reader has no SQL
  write operation.
- [~] Runtime smoke check after the audit: `/health` is `Healthy`; unauthenticated
  PM project/workspace requests return `401`, not `502` or `500`.
- [~] Corrected PM Flow stakeholder parity against Jarvis `pm-flow`: status is
  `progress` when rows exist, metrics show internal/external counts, and the
  source power/interest completeness note is preserved.
- [~] UI parity audit identified a structural gap: the target local PM screen
  currently adds target-only banners, filters and analysis panels around the
  flow, while Jarvis uses the compact project selector → sheet tabs → summary
  → flow → inline sheet layout. Structural UI correction remains pending.
- [~] Restored the source-style PM header and sheet navigation on the target
  local screen. Sheet selection now scrolls to the existing read-only flow,
  WBS or PMBOK section and delegates PMBOK tab selection without adding
  mutations or changing the source data contract.
- [~] Corrected the local PM sheet behavior to match Jarvis: only the active
  sheet is visible. Overview no longer renders every analysis panel inline;
  WBS and PMBOK sheets now expose their own existing read-only content, while
  target-only filters are hidden from the source-parity shell.
- [~] Reworked the local PM overview presentation to follow Jarvis' compact
  summary strip and vertical PM Flow: phase separators, numbered rail cards,
  source-like metric chips and source spacing replace the target three-column
  card grid. Existing target data calculations remain unchanged.
- [ ] Deployment and operations design

## Review gate

Do not begin feature-module construction until the Inception artefacts and migration decisions are reviewed and approved.
