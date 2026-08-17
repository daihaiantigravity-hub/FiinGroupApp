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
- [~] Project Management / TFS + target PM read-only — source-aligned React layouts for `projectmanagement` and `project-tasks`, target core workspace and optional target PMBOK workspace; source Jarvis-backed PMBOK, summary/resource data, mapping and mutation remain gated
- [~] Wiki / documents / announcements — source-aligned React read-only routes with legacy list adapters; standalone `/documents` remains the source `[WIP]` boundary; target content API, permission mapping and mutations remain pending

## Migration decision

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
- Target-only PM core and optional PMBOK read workspaces are available behind
  the separate `/projectmanagement-local` route and the explicit
  `ProjectManagement` store connection. They cover the target core tables and
  source-defined PMBOK tables with optional synthetic fixtures; they do not
  change the Jarvis/TFS mapping or unblock baseline, comments, attachments,
  activity-log, approval or mutation work.

### OPERATIONS

- [ ] Deployment and operations design

## Review gate

Do not begin feature-module construction until the Inception artefacts and migration decisions are reviewed and approved.
