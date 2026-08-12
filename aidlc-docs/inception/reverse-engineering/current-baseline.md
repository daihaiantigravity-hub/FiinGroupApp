# Current Legacy Baseline

**Source:** `D:\DEV\FiinGroup.Jarvis`  
**Measured:** 2026-08-12  
**Method:** static file and route inspection; no production database mutation.

## Current measurements

| Area | Count/observation |
|---|---:|
| JavaScript files outside node_modules/.git | 352 |
| HTML files outside node_modules/.git | 88 |
| CSS files outside node_modules/.git | 81 |
| SQL files outside node_modules/.git | 106 |
| Express route modules | 98 |
| Route declarations | 795 |
| Migration files | 191 |
| Frontend page domains | 12 |
| Background workers | 4 |
| Backend runtime | Node.js + Express |
| Database access | MySQL/MariaDB via mysql2 |

## Page domains

`accounting`, `chatbot`, `dashboard`, `documents`, `facility`, `hr`, `kpi-revenue`, `profiles`, `projects`, `reports`, `salary`, `settings`, `training`.

## Entrypoints and boundaries

- Backend composition: `server/index.js`.
- Frontend shell: `index.html`, `login.html`, `js/`, `pages/`, `css/`.
- Authentication: `server/routes/auth.js` and auth middleware.
- Chatbot: `/chatbot-api` and `/chatbot-admin-api` proxies.
- Workers: mail, cost, balance and weekly cost lock.
- Database migrations: `server/migrations/` and deployment SQL.

## Validation limits

This baseline is a source inventory, not proof of production behavior. Runtime behavior, database contents, permissions and external integrations must be verified with controlled fixtures and approved environments.
