# Component Inventory

## Application Components

| Component | Count | Purpose |
|---|---:|---|
| Static frontend HTML | 87 | Login, shell, and domain pages |
| Frontend JavaScript | 337 total JS files including backend; pages contain 80+ domain scripts | UI behavior and API clients |
| Express route modules | 96 | Domain REST APIs and proxy endpoints |
| Shared services | 9 | Approval, accounting, cost, mail, calendar, jobs |
| Workers | 4 | Mail polling, daily cost, balance snapshots, weekly locks |

## Infrastructure/Data Components

| Component | Count | Purpose |
|---|---:|---|
| Baseline schema files | 3 | Master/HR/PM and Redmine-compatible tables |
| Baseline table declarations | 177 | Core operational and legacy data model |
| Stored routine files | 2 | Functions and procedures for encryption, calendars, ERP/cost/salary calculations |
| Seed files | 5 | Groups, permissions, workflows, parameters, form actions |
| Incremental migration files | 189 | Evolution, repair, imports, and feature migrations |
| Deployment scripts | 3 | Setup, auto-deploy, migration execution |

## Shared Packages

This repository is a monolith rather than a multi-package workspace. Shared code is organized as folders under `server/`:

- `server/db.js` — database access and transaction boundary.
- `server/middleware/` — authentication and authorization.
- `server/helpers/` — permission and organizational hierarchy calculations.
- `server/services/` — cross-domain business services.
- `server/utils/` — encryption, HTML sanitization, logging, and caches.

## Test Components

No dedicated unit, integration, contract, browser, load, or property-based test package was found. `server/insert-test-tasks.js` and migration/import scripts are operational utilities, not an automated test suite.

## Total Count

- **Visible files analyzed**: 618
- **Application/backend route modules**: 96
- **Infrastructure/data migration files**: 189
- **Baseline schema tables**: 177 declarations
- **Dedicated test packages**: 0
