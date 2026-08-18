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

Copy `frontend/.env.example` to `frontend/.env.local` before running the frontend.
Use `VITE_AUTH_MODE=legacy` to compare against Jarvis APIs, or
`VITE_AUTH_MODE=target-dev` to test the new .NET/TFS session. Start the backend on
the target proxy URL and Jarvis on the legacy proxy URL when testing both modes.

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

`/documents` intentionally preserves the Jarvis `[WIP]` screen because the source module does not
define a data/API contract.

## Migration rule

`D:\DEV\FiinGroup.Jarvis` is the trusted legacy reference for behavior and code comparison. FiinGroupApp is built incrementally; the new database/user store is the target ownership model, while legacy adapters are used only for compatibility validation during migration.

Database migrations are applied explicitly with `backend.DatabaseMigrator`; the API never migrates the database at startup.

Disposable database integration setup is documented in `docs/integration-test-runbook.md`; it uses MariaDB and is separate from Jarvis.

For schema/WBS comparison only, the target also contains a synthetic local fixture
at `backend/Database/Fixtures/project-management-local-fixture.sql`. It is not
loaded at startup and must only be imported into a disposable local database; it
does not contain Jarvis business records or credentials.

Pilot users are created explicitly with `backend.IdentityProvisioner`; no credentials are seeded in source control.

For the internal TFS pilot, grant read-only project permissions explicitly with
`backend.PermissionProvisioner`; see `docs/tfs-permission-provisioning-runbook.md`.
To test the separately gated TFS Task creation pilot, set
`$env:Tfs__WriteEnabled = "true"` and provision only the `ADD` action with
`--allow-add true`. This writes directly to TFS, not the Jarvis database; edit,
delete and PMBOK persistence remain disabled.

The technical pilot configuration and evidence requirements are documented in `docs/pilot-environment.md`.

TFS domain login setup and troubleshooting are documented in `docs/tfs-login-troubleshooting.md`. The target must be restarted after changing `Tfs__*` environment variables.

For repeatable local startup, use `scripts/start-target-dev.cmd -StartFrontend`
and follow `docs/local-startup-runbook.md`. It detects an existing backend on
port 5080 instead of launching a duplicate process.
