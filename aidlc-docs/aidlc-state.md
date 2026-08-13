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
- [~] Project Management / TFS read-only — source-aligned React layouts for `projectmanagement` and `project-tasks`, plus project collections, project detail, teams, iterations, work items and first WBS projection via React/API v2; Jarvis DB-backed PMBOK, summary/resource data and mutation remain gated
- [~] Wiki / documents / announcements — source-aligned React read-only routes with legacy list adapters; target content API, permission mapping and mutations remain pending

## Migration decision

- Legacy Jarvis is the trusted behavioral/source reference.
- FiinGroupApp owns the target implementation and future user/permission store.
- Migration is validated by source-to-target comparison artifacts and tests.
- Current source inventory refreshed on 2026-08-12; see `inception/reverse-engineering/current-baseline.md`.
- Authentication target remains behind the comparison/acceptance gate; see `construction/auth-contract-matrix.md`.
- TFS project-management UI comparison and migration boundary are documented in `construction/tfs-project-management-ui.md`.
- Wiki and announcements compatibility boundary is documented in `construction/content-compatibility.md`.

### OPERATIONS

- [ ] Deployment and operations design

## Review gate

Do not begin feature-module construction until the Inception artefacts and migration decisions are reviewed and approved.
