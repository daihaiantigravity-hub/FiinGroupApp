# Dashboard Platform slice

## Scope

This slice provides a read-only technical dashboard for the internal pilot:

- authenticated user and provider summary;
- target form/action permission counts;
- `/api/v2/ping` and `/health` status;
- explicit migration boundary for legacy business dashboard data.

## Legacy comparison

Jarvis `server/routes/dashboard.js` exposes business data such as employee, project, revenue, pending evaluation, activities and task statistics. Those endpoints read the legacy operational database and are not silently reimplemented against the new identity database.

The target React dashboard therefore does not display fabricated business numbers. A future dashboard data adapter must define one read-only endpoint at a time, preserve the legacy response meaning, add permission mapping and compare controlled fixtures before traffic is switched.

## Acceptance for this slice

- TFS-authenticated user can open `/dashboard`.
- Browser refresh restores the target session.
- Platform health and ping states are visible.
- No legacy database mutation occurs.
- Build and frontend tests pass.

## Next boundary

Select the first business read model, document its source tables and permission code, then implement a compatibility client or `/api/v2` read-only adapter. Do not start with revenue/payroll data before the permission and sensitive-data review is approved.
