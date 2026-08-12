# Local Runbook

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

By default Vite proxies `/api` and `/uploads` to the legacy Jarvis server at `http://localhost:3000`. Override it with `LEGACY_API_PROXY_TARGET` when the legacy server uses another address.

## Backend

The project targets .NET 8. Install the .NET 8 SDK before running:

```powershell
cd backend
dotnet restore
dotnet run
```

The machine currently exposes .NET 9 and .NET 10 SDKs only. Restore/build was verified successfully using the .NET 8 target assets; install the .NET 8 SDK for a fully pinned local toolchain.

## Verification

```powershell
cd frontend
npm test
npm run build

cd ..\backend
dotnet restore
dotnet build --no-restore

cd ..\backend.Tests
dotnet test

cd ..\backend.DatabaseMigrator
dotnet build

cd ..\backend.IdentityProvisioner
dotnet build
```
