# Full Jarvis → FiinGroupApp migration map

## Baseline inventory — 2026-08-14

The trusted source currently contains approximately:

- 88 HTML screens;
- 353 JavaScript files, including page logic, services, workers and scripts;
- 81 CSS files;
- 106 SQL/migration files;
- dozens of Express route modules under `server/routes`.

The target currently contains the application platform, authentication, TFS
project-management projection and the first content adapters. A full conversion
therefore must be executed as module batches; it is not a safe file-copy task.

The target now also contains an explicitly gated, target-only PM core/PMBOK
read model with disposable synthetic fixtures. This supports UI/API contract
validation; it is not a source business-data migration and does not remove the
database snapshot, mapping or permission blockers below.

## Module order

| Batch | Source scope | React target | .NET target | Data dependency | Risk |
|---|---|---|---|---|---|
| 1 | Shell, auth, profile | Completed foundation | Completed foundation | Identity store + TFS auth | Medium |
| 2 | Dashboard | Existing target dashboard | Existing read contract | Jarvis business DB | High / blocked |
| 3 | Project/TFS read projection | Existing project screens | Existing TFS adapter | TFS only | Medium |
| 4 | PMBOK/project business sheets | Pending | Pending | `pm_project`, PMBOK tables | High / blocked |
| 5 | Wiki, announcements, documents | First read adapters | Legacy boundary | Jarvis DB/storage | High / blocked |
| 6 | HR/profile/recruitment | Pending | Pending | `hr_*`, `mt_*` tables | High / blocked |
| 7 | Salary/accounting/finance | Pending | Pending | salary/accounting tables and secrets | Critical / blocked |
| 8 | Training/reports/facility/settings | Pending | Pending | multiple `hr_*`, `mt_*` tables | High / blocked |
| 9 | Chatbot | Pending | Pending | chatbot tables, file storage, AI config | High / contract required |
| 10 | Workers/integrations/deployment | Pending | Pending | mail, cost, TFS sync, external systems | Critical |

## Conversion rules

For each screen/module, the migration must preserve source:

1. route and navigation label;
2. field names and validation;
3. API request/response behavior;
4. permission checks and owner restrictions;
5. loading, empty, error and mutation behavior;
6. table, modal, popup, hover, scroll and keyboard interactions;
7. audit, soft-delete, transaction and rollback semantics.

React components may replace the HTML/vanilla-JS implementation, but the source
screen and its API route remain the comparison oracle. ASP.NET controllers must
not access SQL directly; the port must use controller → service → repository and
DTO boundaries.

## Current blockers for full conversion

- The Jarvis business database is not currently available for a complete
  read-only snapshot.
- TFS project IDs and Jarvis `pm_project.id_project` have not been approved as a
  mapping pair.
- Many source routes depend on table data, file storage, workers or external
  services that are not present in the target.
- Full mutations cannot be enabled without source permission matrices,
  transaction behavior and rollback tests.

These blockers do not block source inspection or UI/API contract documentation,
but they block claiming a faithful full backend conversion. No fake business
data will be used to close that gap.

## Definition of done for each batch

- source page/API/schema inventory recorded;
- React screen compared against source screenshot and interaction checklist;
- .NET API contract and permission matrix approved;
- disposable test data or approved source snapshot available;
- unit/integration/compatibility tests pass;
- no changes made to `FiinGroup.Jarvis`;
- rollback and human review recorded in AI-DLC audit.
