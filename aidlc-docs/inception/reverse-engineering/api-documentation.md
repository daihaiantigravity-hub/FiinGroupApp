# API Documentation

## API Surface Summary

- **HTTP server**: `server/index.js`
- **Domain route modules**: 96
- **Route declarations**: 782 (`GET`, `POST`, `PUT`, `PATCH`, and `DELETE`)
- **Direct application endpoints**: health plus three manual worker triggers and startup-mounted routes.
- **Response style**: JSON objects/arrays for business APIs; file downloads, uploads, and SSE for specialized flows.
- **Authentication**: Global JWT guard covers `/api/*` except the explicit login/2FA bootstrap allowlist. Chatbot proxy paths are mounted outside `/api` and have a separate trust model.

## REST API Catalog by Business Area

| Area / base path | Route modules | Representative operations | Data / integration |
|---|---|---|---|
| Authentication `/api/auth` | `auth.js` | login, verify TOTP, setup/confirm 2FA, user verification, permissions, admin 2FA | Redmine users, HR employees, 2FA, mail |
| Project management `/api/pm-*`, `/api/project-*`, `/api/task-plans`, `/api/weekly-report` | 30+ PM modules | projects, teams, tasks, charter, stakeholder, resource, risk, cost plan, quality, change, communication, payments, commissions, reports | `pm_*`, Redmine tables |
| HR `/api/hr-*`, `/api/salary-advance`, `/api/monthly-*` | 30+ HR/salary modules | employees, contracts, leave, requests, bonus, salary, exams, onboarding, time entries, budgets | `hr_*`, `pm_monthly_timesheet` |
| Accounting `/api/v1/mt_accounts`, `/api/bank-accounts`, `/api/project-cost` | account/bank/cost modules | accounts, mappings, transactions, transfers, balances, bank data, project cost | `mt_account*`, cost tables, stored routines |
| Master data `/api/v1/mt_*`, `/api/parameters`, `/api/holidays`, `/api/skills` | settings and master-data modules | products, suppliers, assets, rooms, groups, mail, wiki, announcements, skills, parameters | `mt_*`, related HR tables |
| Approval `/api/v1/approvals` plus domain approval actions | `approvals.js`, domain routes | list/approve/reject/pay/complete workflow instances | `mt_approval_*`, business objects |
| Reporting `/api/dashboard`, `/api/ceo-dashboard`, `/api/search`, `/api/quality-evaluation` | dashboard/report modules | dashboards, search, evaluation summaries, executive views | Aggregated HR/PM/finance data |
| Files `/api/upload` and domain attachments | `upload.js` plus attachment handlers | upload, download, import/export templates, attachments | Local `server/uploads` and DB metadata |
| Chat `/chatbot-api` | `chatbot-proxy.js` | knowledge bases, sessions, messages, suggestions, feedback, streaming chat | StoneHub chatbot service |
| Chat admin `/chatbot-admin-api` | `chatbot-admin-proxy.js` | knowledge bases, documents, chunks, sessions, Q&A, suggestions, upload/download | StoneHub chatbot service |

## Common Request/Response Contracts

### Authentication

- **Request**: JSON credentials `{ username, password, rememberMe? }`; 2FA continuation uses `{ otpToken, totpCode }` or setup token/code.
- **Response**: `{ success, token, user }` on success; intermediate login may return `requireTOTP`, `otpToken`, `method`, or `requireSetup`.
- **Token**: JWT sent as `Authorization: Bearer <token>`; file-download flows may also use a `token` query parameter.

### CRUD domain APIs

- **Request**: JSON bodies for create/update, route IDs in `req.params`, filters/pagination in `req.query`.
- **Response**: Commonly `{ success, data }`, `{ success, message }`, or direct arrays/objects depending on the route module. The contract is not globally standardized.
- **Errors**: Usually HTTP 400/401/403/404/500 with `{ success: false, message/error }`; some legacy modules return direct error shapes.

### Uploads and downloads

- **Upload**: `multipart/form-data`, field `file`, optional sanitized `folder`; 10 MB limit with MIME and extension allowlists.
- **Response**: `{ success, url, filename, originalname, size }`.
- **Download**: Attachment routes resolve DB metadata and call `res.download` or stream external content.

### Chat streaming

- **Request**: JSON POST body to `/chatbot-api/chat/stream`.
- **Response**: `text/event-stream`; the proxy forwards the upstream stream and aborts when the browser closes the request.

## Data Models and Relationships

The database is the source of truth for detailed models. The dominant relationship families are:

- `users` / Redmine identity → `hr_employees` → HR contracts, salary, leave, bonus, assets, skills, evaluations.
- `pm_project` → project plans, tasks, members, cost, payments, commissions, risks, resources, quality, changes, communications.
- `mt_user_group` → group members → `mt_form_permission` and `mt_form_action_permission`.
- `mt_approval_workflow` → steps → approval instances/actions attached to domain entities.
- `mt_account` → mappings, transactions, transfers, balances, attachments.
- `mt_exam_session` → questions/attempts → skill and evaluation reporting.

## API Findings Requiring Follow-Up

1. The API surface is large and not represented by an OpenAPI contract, making drift and client compatibility difficult to detect.
2. Response envelopes and error shapes vary across route generations.
3. Authorization policy is partly centralized and partly attached at mount/handler level; a route-to-permission matrix should be generated and tested.
4. `/chatbot-api` and `/chatbot-admin-api` are outside the `/api/*` global JWT guard and must be treated as separate externally reachable trust boundaries.
