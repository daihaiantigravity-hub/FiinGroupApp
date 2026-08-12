# Technical Pilot Environment

## Target architecture

- React dev server: `http://localhost:5173`.
- Legacy Jarvis API during compatibility mode: `http://localhost:3000`.
- New .NET API: `http://localhost:5080`.
- New identity database: dedicated `FiinGroupApp.Identity` only.

## Enabling the new identity store

Do this only after the identity migration has been applied and a pilot user has been provisioned:

```powershell
$env:IdentityStore__Enabled = "true"
$env:ConnectionStrings__Identity = "<secret connection string>"
cd backend
dotnet run
```

The connection string must not be committed to source control. If the store is enabled without a connection string, the API fails fast. If it is disabled, the development store rejects all credentials.

## Compatibility mode

The React app currently uses the legacy auth adapter and Vite proxies `/api` to Jarvis. This remains the default pilot mode until the target session/2FA implementation passes the acceptance checklist.

## Required pilot evidence

- Migration checksum and execution record.
- No committed secrets or seed credentials.
- Provisioned pilot account record.
- Auth contract comparison results.
- Permission/profile comparison results.
- Rollback test to legacy adapter.
