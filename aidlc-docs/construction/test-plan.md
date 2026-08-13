# Application Platform Test Plan

## Automated checks

- Frontend TypeScript check and production build.
- Backend compile and test.
- Health endpoint success and failure-safe responses.
- `/api/v2/ping` contract.
- CORS origin allowlist.
- Error envelope without exception or secret leakage.
- Legacy/new API base URL separation.

## Manual review

- Clean checkout startup.
- Browser navigation and API check button.
- Swagger/OpenAPI availability in development.
- Logs contain no credentials, tokens, OTPs or sensitive request bodies.

## TFS project-management compatibility checks

- `/projectmanagement` keeps the Jarvis project-management shell: project selector,
  PM sheet order and the read-only boundary for sheets that still require Jarvis DB.
- `/project-tasks` opens the selected project in the `Tiến độ dự án` view and loads
  work items through the approved `/api/v2/tfs/projects/{projectId}/work-items`
  contract only.
- The task grid preserves the Jarvis column order: STT, code, title, product,
  assignee, start, finish, progress, plan, status, priority, creator and action.
- State, assignee and priority filters change only the displayed TFS projection;
  the project selection and already loaded data remain consistent after filtering.
- Summary cards calculate Total Task, Completed, In Progress, Overdue and Average
  Progress from the loaded TFS work items; no dashboard or Jarvis DB values are
  fabricated when that source is unavailable.
- Gantt view renders the TFS date range, month/day headers, weekend cells, today
  marker, zoom controls and progress fill. Work items without usable dates show a
  clear empty state.
- Opening a work item shows the read-only detail modal and the TFS link; browser
  network inspection confirms there is no create, update or delete request.
- API responses with 401, 403, 404, 400 or 503 remain visible with their error code
  and do not leave stale data from a previously selected project on screen.
