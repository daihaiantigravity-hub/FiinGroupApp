# Construction — Application Platform

## Unit of Work

React shell, shared typed API boundary, ASP.NET Core API skeleton, health/OpenAPI, configuration, error handling, CORS, logging, and build/test foundation.

## Public interfaces

- New API prefix: `/api/v2`.
- Health endpoint: `/health`.
- OpenAPI endpoint: `/swagger` in development.
- Legacy API client: configurable base URL, preserving legacy contract.
- New API client: configurable `/api/v2` base URL.
- React shell navigation: Jarvis-aligned sidebar starts collapsed and persists
  the user choice under `sidebarCollapsed`; mobile navigation remains expandable.

## Definition of Done

- Frontend and backend build successfully.
- Health endpoint is testable.
- No secrets are committed or logged.
- Legacy system remains untouched.
- Documentation, tests, and rollback notes are committed with the unit.

## Identity-store diagnostics

TFS identity resolution logs the safe MySQL error category in the target API
terminal without logging credentials or the connection string. In Development,
the response distinguishes credential rejection, missing database, missing
schema and generic unavailability so the technical pilot can correct runtime
configuration without changing authentication behavior.
