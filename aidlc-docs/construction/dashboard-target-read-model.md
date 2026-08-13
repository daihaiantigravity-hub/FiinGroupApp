# Target Dashboard read model

## Scope

`GET /api/v2/dashboard/stats` is the first target read-only business endpoint. It requires the target session cookie and reads only the legacy operational database through a separately configured connection string.

The target identity database is never used for these aggregates. No schema migration or write query is performed.

## Safety gates

- Disabled by default with `Dashboard:LegacyStatsEnabled=false`.
- Enabling it requires `ConnectionStrings:LegacyOperational`.
- The connection must be provisioned as read-only and must not be the identity connection.
- TFS credentials and Jarvis JWT secrets are not used by the read model.
- Database errors are returned as safe error codes without SQL or connection-string details.
- The target requires `dashboard` form permission with both `canAccess` and `canView`; TFS users with the currently empty permission snapshot receive 403.
- Permissions can be supplied by an explicitly reviewed TFS external-identity mapping in the new identity store; login never auto-provisions that mapping.
- An unavailable identity mapping store is a 503 configuration/infrastructure error; the target must not silently fall back to empty permissions when identity-store mode is enabled.

## Source comparison

The SQL follows Jarvis `server/routes/dashboard.js` for employee, project, revenue and pending-evaluation aggregates. Revenue uses the same cutoff and encrypted-amount function boundary; it must be validated against a disposable/approved clone before pilot use.

## Acceptance gate

- Unauthenticated request returns 401.
- Authenticated user without dashboard permission returns 403.
- Disabled configuration returns `DASHBOARD_DATASTORE_NOT_CONFIGURED`.
- Enabled read-only clone returns the same fixture aggregates as Jarvis.
- No INSERT, UPDATE, DELETE, migration or startup database mutation occurs.
