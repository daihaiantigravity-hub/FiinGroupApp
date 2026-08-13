# FiinGroupApp

React + TypeScript + Vite frontend and ASP.NET Core .NET 8 migration target for Goline Jarvis.

## Status

The project is in AI-DLC Inception. The legacy Jarvis application remains the source of truth while modules are migrated incrementally.

## Structure

- `frontend/` — React/TypeScript/Vite application.
- `backend/` — ASP.NET Core Web API target.
- `aidlc-docs/` — AI-DLC state and project artefacts.
- `docs/` — migration and legacy-system documentation.

## Local commands

```text
cd frontend && npm install && npm run dev
cd backend && dotnet run
```

Frontend requires Node.js 20.19 or newer because the current Vite toolchain does not support Node 14/18.
Backend requires the .NET 8 runtime/SDK. If the API is already running, stop it before rebuilding so
`backend/bin/Debug/net8.0/FiinGroupApp.Api.exe` is not locked.

For the target TFS pilot, start the frontend with `VITE_AUTH_MODE=target-dev`, sign in, then open
`/projectmanagement`. The project screen follows the Jarvis project-management layout with read-only
sheets for overview, teams, iterations and work items. `/project-tasks` opens the WBS/progress sheet
directly. PMBOK write screens remain disabled until their contracts and data sources are approved.

`/wiki` and `/announcements` follow the Jarvis content-management UI. In legacy mode they read from
the existing Jarvis list endpoints; in target TFS mode they show the explicit not-yet-approved API
boundary and keep create/edit/delete disabled.

## Migration rule

`D:\DEV\FiinGroup.Jarvis` is the trusted legacy reference for behavior and code comparison. FiinGroupApp is built incrementally; the new database/user store is the target ownership model, while legacy adapters are used only for compatibility validation during migration.

Database migrations are applied explicitly with `backend.DatabaseMigrator`; the API never migrates the database at startup.

Disposable database integration setup is documented in `docs/integration-test-runbook.md`; it uses MariaDB and is separate from Jarvis.

Pilot users are created explicitly with `backend.IdentityProvisioner`; no credentials are seeded in source control.

The technical pilot configuration and evidence requirements are documented in `docs/pilot-environment.md`.

TFS domain login setup and troubleshooting are documented in `docs/tfs-login-troubleshooting.md`. The target must be restarted after changing `Tfs__*` environment variables.
