# Local startup runbook

Use the checked-in launcher from the FiinGroupApp repository. It keeps the
target TFS settings consistent and prevents a second backend from attempting
to bind port 5080.

## First-time prerequisite

Create the User environment variable `FIINGROUPAPP_SESSION_KEY` once. Do not
commit the value or place it in this repository. The target backend reads the
identity connection string from the current shell when the identity store is
enabled; do not store database passwords in this runbook or in scripts.
When the local `fiingroup-identity-db-integration` container is running, the
launcher reads its connection settings at runtime and enables IdentityStore
without printing or saving the password.
When the same container contains `FiinGroupApp.ProjectManagement`, the
launcher also enables the target PM read store and PMBOK read slice using that
database. The target database must already have approved migrations; the API
does not migrate or seed it at startup.

## Normal start

From `D:\DEV\FiinGroupApp`:

```powershell
.\scripts\start-target-dev.cmd -StartFrontend
```

Then open `http://localhost:5173` and press `Ctrl+F5` if the browser has an old
bundle. The script starts the backend on 5080 and the Vite frontend on 5173.
If either process is already running, it reuses it and reports the HTTP
session probe instead of starting a duplicate process.

## Intentional backend restart

Only when code or environment configuration changed:

```powershell
.\scripts\start-target-dev.cmd -RestartBackend -StartFrontend
```

The restart switch stops only a process identified as belonging to this target
repository. It refuses to stop an unrelated process that owns port 5080.

## Known symptom

`Failed to bind to address http://127.0.0.1:5080: address already in use`
means a backend is already running. Do not run a second `dotnet run`; use the
normal start command, or use `-RestartBackend` after verifying that the process
belongs to FiinGroupApp.

`TFS_DISABLED` means the request reached a different/old backend instance or a
non-Development configuration. The Development appsettings and
`FiinGroupApp.Api` launch profile both contain the non-secret TFS settings;
restart the target-owned instance through this runbook.

`TFS_FORBIDDEN` after a successful TFS login means the TFS identity is not
mapped to an application user with the `TFS_READONLY` role. Use the identity
mapping and permission provisioners for another account; do not bypass the
permission check in code.

Never record TFS, database, or user passwords in this file, source control, or
support messages.
