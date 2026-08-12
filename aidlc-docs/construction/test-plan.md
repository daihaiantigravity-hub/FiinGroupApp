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
