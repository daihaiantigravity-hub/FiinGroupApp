# Migration Catalog

| Unit | Legacy source of truth | Target area | Current status |
|---|---|---|---|
| Application Platform | `server/index.js`, `package.json`, `index.html` | `frontend/`, `backend/` | Scaffolded |
| Authentication/profile | `server/routes/auth.js`, auth middleware, permission helper | React auth + .NET auth/user store | Legacy adapter implemented; target store pending |
| Shared UI/data | `js/app.js`, `js/utils.js`, `css/`, repeated page patterns | React shared components/API client | Pending |
| Dashboard | `pages/dashboard/`, `server/routes/dashboard.js` | Dashboard feature | Pending |
| Wiki/documents | `pages/documents/`, `pages/*wiki*`, upload routes | Documents feature | Pending |
| Project management | `pages/projects/`, `server/routes/pm-*`, project migrations | Project feature | Pending |
| Approval workflow | `server/services/approvalEngine.js`, approval routes/migrations | Approval feature | Pending |
| HR | `pages/hr/`, `server/routes/hr-*` | HR feature | Pending |
| Salary/finance | salary/account/cost routes, services, routines | Finance feature | Pending |
| Chatbot | `js/chatbot/`, chatbot proxy routes | Chatbot feature | Pending |
| Integrations/workers | `server/services/`, `server/workers/`, deployment scripts | Integration/operations | Pending |

## Comparison deliverable per unit

Each unit must add a source-to-target mapping, API contract comparison, permission matrix, data impact note, compatibility fixtures, and rollback note before acceptance.
