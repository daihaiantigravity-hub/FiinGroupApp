# Legacy Dashboard compatibility boundary

## Verified source contract

Jarvis mounts `server/routes/dashboard.js` at `/api/dashboard`. Its global API guard in `server/index.js` requires a valid Jarvis JWT before the route is reached. The selected read-only endpoint is:

```text
GET /api/dashboard/stats
```

The response contains employee, project, revenue and pending-work aggregates. It reads the legacy operational database and must not be treated as data from the new identity store.

## Target behavior

- `VITE_AUTH_MODE=legacy`: React uses the legacy auth adapter and its bearer JWT to call the read-only endpoint.
- `VITE_AUTH_MODE=target-dev`: React uses the .NET TFS session and does not call `/api/dashboard/stats`, because Jarvis does not accept the target HttpOnly session as a JWT.
- No target service stores a Jarvis JWT secret or forwards TFS passwords to Jarvis.

## Acceptance gate before target-mode business data

One of these designs must be approved:

1. migrate the dashboard read model into .NET with explicit data ownership and permission mapping; or
2. introduce a reviewed service-to-service token exchange between target and Jarvis.

Until then, target mode shows platform health/session information only. This prevents accidental cross-system authentication bypass and keeps the rollback path to Jarvis explicit.
