# Requirements Analysis — Application Platform

## Objective

Provide a safe, independently deployable foundation for React modules and .NET APIs during the incremental Jarvis migration.

## Functional requirements

- Serve a React shell with client-side routing.
- Provide a typed API client boundary for legacy and `/api/v2` APIs.
- Expose a .NET health endpoint and OpenAPI document.
- Load environment-specific settings without source-controlled secrets.
- Return a consistent error envelope from new APIs.
- Support configurable CORS and structured, redacted logging.

## Non-functional requirements

- TypeScript strict mode.
- .NET 8 target.
- No direct database access from controllers.
- No access tokens in localStorage by default.
- No production schema change in this unit.
- Build and test must work from a clean checkout.

## Acceptance criteria

See `docs/project-brief.md` and the Application Platform unit design. All criteria require automated verification where practical and human review for security and compatibility decisions.
