# FiinGroupApp

React + TypeScript + Vite frontend and ASP.NET Core .NET 8 migration target for Goline Jarvis.

## Status

The project is in AI-DLC Inception. The legacy Jarvis application remains the source of truth while modules are migrated incrementally.

## Structure

- `frontend/` — React/TypeScript/Vite application.
- `backend/` — ASP.NET Core Web API target.
- `aidlc-docs/` — AI-DLC state and project artefacts.
- `docs/` — migration and legacy-system documentation.

## Run locally

### Requirements

- Windows PowerShell.
- Node.js 20.19 or newer.
- .NET 8 SDK.
- Network/VPN access to the configured TFS server for TFS login and project data.
- Docker is optional. It is only needed when using the local identity/project-management database containers.

### First checkout

```powershell
git clone <repository-url> FiinGroupApp
cd FiinGroupApp

Copy-Item frontend/.env.example frontend/.env.local

Push-Location frontend
npm install
Pop-Location
```

For the new React + .NET + TFS flow, edit `frontend/.env.local` to contain:

```dotenv
VITE_AUTH_MODE=target-dev
TARGET_API_PROXY_TARGET=http://localhost:5080
```

Keep `VITE_AUTH_MODE=legacy` and `LEGACY_API_PROXY_TARGET=http://localhost:3000` when comparing the React UI with the legacy Jarvis API.

### Recommended start

Create the local session key once. Do not commit it:

```powershell
$sessionKey = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
[Environment]::SetEnvironmentVariable('FIINGROUPAPP_SESSION_KEY', $sessionKey, 'User')
```

Start both applications from the repository root:

```powershell
.\scripts\start-target-dev.cmd -StartFrontend
```

Open `http://localhost:5173`. The script starts/reuses the .NET API on port `5080` and Vite on port `5173`; it refuses to stop an unrelated process that owns port `5080`. Use `-RestartBackend -StartFrontend` only after changing backend code or `Tfs__*` settings:

```powershell
.\scripts\start-target-dev.cmd -RestartBackend -StartFrontend
```

The launcher uses safe target settings. If the local identity database container is unavailable, it prints a warning and the API can still be used for development/TFS login according to the active configuration.

### Manual start (TFS Task CRUD)

Use this when testing Task create/edit/remove against TFS. Run the backend and frontend in separate PowerShell windows. Replace `Tfs__BaseUrl` and `Tfs__Collection` with the values for the team environment; never put a TFS password in source control.

Backend:

```powershell
cd D:\DEV\FiinGroupApp
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5080"
$env:Tfs__Enabled = "true"
$env:Tfs__BaseUrl = "http://192.168.1.40:8080/tfs"
$env:Tfs__Collection = "FiinGroup"
$env:Tfs__RequireIdentityMapping = "false"
$env:Tfs__WriteEnabled = "true"
dotnet run --project backend --no-launch-profile
```

Frontend:

```powershell
cd D:\DEV\FiinGroupApp\frontend
npm install
npm run dev -- --host localhost
```

Verify the API before opening the UI:

```powershell
Invoke-WebRequest http://localhost:5080/health -UseBasicParsing
```

The response should be HTTP `200` with `Healthy`. In the UI choose `TFS domain account`, then open `/projectmanagement` or `/project-tasks`. TFS Task CRUD still depends on the logged-in account's actual ADD/EDIT permission; `Tfs__WriteEnabled=true` only enables the write path. Create/update writes directly to TFS, while delete is a soft-remove to the `Removed` state. Jarvis DB is not written by this flow.

### Legacy comparison mode

Start Jarvis separately on its configured legacy port, set `VITE_AUTH_MODE=legacy` in `frontend/.env.local`, and use:

```dotenv
LEGACY_API_PROXY_TARGET=http://localhost:3000
```

Restart Vite after changing `.env.local`. Do not run the target and legacy servers on the same port.

### Useful commands

```powershell
# Frontend tests and production build
cd D:\DEV\FiinGroupApp\frontend
npm test -- --run
npm run build

# Backend tests; stop the running API first if the apphost is locked
cd D:\DEV\FiinGroupApp
dotnet test backend.Tests --no-restore /p:UseAppHost=false
```

If the API is already running, stop only the target process before rebuilding; otherwise `backend/bin/Debug/net8.0/FiinGroupApp.Api.exe` or its DLL may be locked.

For the target TFS pilot, sign in with `VITE_AUTH_MODE=target-dev`, then open `/projectmanagement`. `/project-tasks` opens the WBS/progress sheet directly. The migrated TFS work-item screen supports direct Task CRUD when the write flag and TFS permissions allow it; PMBOK write screens remain disabled until their contracts and data sources are approved.

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
For a direct TFS-domain login, task creation is enabled only when
`$env:Tfs__WriteEnabled = "true"`; the app then delegates the final ADD check
to TFS using the logged-in user's credential. This writes directly to TFS, not
the Jarvis database; delete is a TFS soft-remove and PMBOK persistence remains disabled. The
separate `ADD`/`EDIT` provisioning flags are still used for non-TFS/local
target sessions.

The technical pilot configuration and evidence requirements are documented in `docs/pilot-environment.md`.

TFS domain login setup and troubleshooting are documented in `docs/tfs-login-troubleshooting.md`. The target must be restarted after changing `Tfs__*` environment variables.

For repeatable local startup, use `scripts/start-target-dev.cmd -StartFrontend`
and follow `docs/local-startup-runbook.md`. It detects an existing backend on
port 5080 instead of launching a duplicate process.
