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

## TFS target-dev login

Configure the target API with the TFS endpoint without putting user credentials in the application:

```powershell
$env:Tfs__Enabled = "true"
$env:Tfs__BaseUrl = "http://192.168.1.40:8080/tfs"
$env:Tfs__TimeoutSeconds = "15"
```

Use the same base URL that Jarvis reads from `TFS_BASE_URL`. Do not append `/_apis/connectionData`; the target API appends it. In the React login form choose `TFS domain account`, enter either `username` plus `DOMAIN` or `DOMAIN\username`, and use `VITE_AUTH_MODE=target-dev`. The .NET API performs the NTLM handshake against `/_apis/connectionData`; supplied credentials are used only for that request and are not stored. See `docs/tfs-login-troubleshooting.md` for safe error codes.

After successful TFS validation, the pilot API issues an HttpOnly session cookie. The session is in-memory and is intended for internal technical testing only; it is cleared when the API restarts. `/api/v2/auth/session` restores the login after a browser refresh and `/api/v2/auth/logout` clears it.

## Compatibility mode

The React app currently uses the legacy auth adapter and Vite proxies `/api` to Jarvis. This remains the default pilot mode until the target session/2FA implementation passes the acceptance checklist.

For a local target-login smoke test, configure the .NET Development environment with `DevelopmentAuth:Username`, `DevelopmentAuth:Password` and `DevelopmentAuth:DisplayName`, then start the frontend with `VITE_AUTH_MODE=target-dev`. The target-dev store is available only when `ASPNETCORE_ENVIRONMENT=Development`; it is not a production authentication mechanism and does not yet provide OTP or persistent sessions.

## Required pilot evidence

- Migration checksum and execution record.
- No committed secrets or seed credentials.
- Provisioned pilot account record.
- Auth contract comparison results.
- Permission/profile comparison results.
- Rollback test to legacy adapter.

The `/health` endpoint includes the identity-store check. In compatibility mode it reports the store as intentionally disabled; when enabled it verifies that the dedicated database and `app_users` table are reachable.
