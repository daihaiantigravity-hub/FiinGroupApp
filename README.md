# FiinGroupApp

React + TypeScript + Vite frontend and ASP.NET Core .NET 8 migration target for Goline Jarvis.

## Status

The project is in AI-DLC Inception. The legacy Jarvis application remains the source of truth while modules are migrated incrementally.

## Structure

- `frontend/` — React/TypeScript/Vite application.
- `backend/` — ASP.NET Core Web API target.
- `aidlc-docs/` — AI-DLC state and project artefacts.
- `docs/` — migration and legacy-system documentation.

## Planned local commands

```text
cd frontend && npm install && npm run dev
cd backend && dotnet run
```

The backend currently requires a .NET 8 SDK. The installed SDK must be checked before scaffolding is finalized.

## Migration rule

`D:\DEV\FiinGroup.Jarvis` is the trusted legacy reference for behavior and code comparison. FiinGroupApp is built incrementally; the new database/user store is the target ownership model, while legacy adapters are used only for compatibility validation during migration.
