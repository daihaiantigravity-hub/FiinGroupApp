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

- [ ] Application Platform
- [~] Authentication and user profile — TFS target login plus in-memory pilot session/profile/permission contracts; persistent store and 2FA migration pending

## Migration decision

- Legacy Jarvis is the trusted behavioral/source reference.
- FiinGroupApp owns the target implementation and future user/permission store.
- Migration is validated by source-to-target comparison artifacts and tests.
- Current source inventory refreshed on 2026-08-12; see `inception/reverse-engineering/current-baseline.md`.
- Authentication target remains behind the comparison/acceptance gate; see `construction/auth-contract-matrix.md`.

### OPERATIONS

- [ ] Deployment and operations design

## Review gate

Do not begin feature-module construction until the Inception artefacts and migration decisions are reviewed and approved.
