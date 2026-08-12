# Technology Stack

## Programming Languages

- **JavaScript/CommonJS** — Node.js backend, workers, migrations, frontend scripts, and build helper.
- **HTML/CSS** — static browser UI.
- **SQL** — MySQL/Redmine schema, stored functions/procedures, seed data, and migrations.
- **Shell** — deployment/setup scripts (`.sh`).

## Frameworks and Libraries

| Technology | Version declaration | Purpose |
|---|---:|---|
| Node.js | Runtime detected: v22.14.0 | Server runtime |
| Express | `^4.18.2` | HTTP API and static server |
| mysql2 | `^3.6.5` | MySQL connectivity |
| jsonwebtoken | `^9.0.3` | JWT authentication |
| cors | `^2.8.5` | CORS policy |
| multer | `^2.0.2` | File uploads |
| node-cron | `^4.2.1` | Scheduled jobs |
| nodemailer | `^8.0.1` | Email delivery |
| otplib / qrcode | `^13.3.0` / `^1.5.4` | TOTP and QR codes |
| sanitize-html | `^2.17.5` | HTML sanitization |
| exceljs / xlsx | `^4.4.0` / `^0.18.5` | Spreadsheet operations |
| sharp | `^0.34.5` | Image processing |
| Quill / DOMPurify | vendored frontend files | Rich text editing and browser sanitization |

## Infrastructure

- MySQL/MariaDB-compatible database, using a Redmine-compatible schema and custom `mt_*`, `hr_*`, and `pm_*` tables.
- SMTP provider configured through environment variables and mail settings.
- External StoneHub chatbot service accessed through outbound HTTPS.
- Local filesystem for uploads and worker logs.
- Deployment appears host/process based; no container/orchestrator definition was found.

## Build and Operations Tools

- npm/package-lock v3 for dependency resolution.
- `nodemon` for local development.
- `terser` as a development dependency and client optimization support.
- Node migration runner and shell deployment scripts.

## Testing Tools

No test framework is declared. There is no Jest, Vitest, Mocha, Playwright, Cypress, ESLint, or CI workflow in the repository.
