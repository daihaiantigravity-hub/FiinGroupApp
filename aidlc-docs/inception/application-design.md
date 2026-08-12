# Application Design — Target Platform

```text
React + TypeScript + Vite
        ↓
Typed API clients (legacy and /api/v2)
        ↓
ASP.NET Core .NET 8 Web API
        ↓
Application services → repositories/data access
        ↓
Existing MySQL/MariaDB
```

The platform starts without a production schema change. Controllers will remain transport-only; business logic and data access will be separated into services and repositories as feature units are added.

The frontend uses an HttpOnly-cookie-compatible client boundary and does not default to localStorage token storage. Legacy and new API clients are separate to make routing and rollback explicit.
