# Project Management Route Parity Matrix

## WBS critical-path parity — 2026-08-17

The source WBS Critical Path read action is now available at
`GET /api/v2/project-management/projects/{projectId}/critical-path` and is
shown in the target project screen as a read-only analysis panel. It uses the
existing target task/dependency projection. The separate source action that
persists `is_critical` is intentionally not ported.

## Target Baseline read parity — 2026-08-17

The source `GET /api/project-tasks/baselines/:projectId` list and
`GET /api/project-tasks/baselines/:projectId/compare?baseline_name=...`
behavior is represented by the target read-only routes:

- `GET /api/v2/project-management/projects/{projectId}/baselines`;
- `GET /api/v2/project-management/projects/{projectId}/baselines/compare?baselineName=...`.

The target query maps `planned_*`, actual task dates/duration and the source
`DATEDIFF` start/end/duration variance fields. The five source summary values
are preserved. `baseline_name` is accepted as a compatibility query alias.
Baseline create/delete/activation and all other writes remain out of scope.

## Target collaboration read parity — 2026-08-17

The source task collaboration GET routes are represented by target-only
read routes:

| Source route | Target route | Boundary |
|---|---|---|
| `/api/project-tasks/:taskId/comments` | `/api/v2/project-management/tasks/{taskId}/comments` | Thread roots only; replies loaded separately |
| `/api/project-tasks/comments/:commentId/replies` | `/api/v2/project-management/comments/{commentId}/replies` | Read-only replies |
| `/api/project-tasks/:taskId/attachments` | `/api/v2/project-management/tasks/{taskId}/attachments` | Metadata/path only; no upload |
| `/api/project-tasks/activity-log/:projectId` | `/api/v2/project-management/projects/{projectId}/activity-log` | Paged project activity |
| `/api/project-tasks/activity-log/task/:taskId` | `/api/v2/project-management/tasks/{taskId}/activity-log` | Bounded task activity |

The target keeps the source comment/attachment/activity columns and does not
join the Jarvis `users` table. `user_login` is shown as-is until a target
identity mapping is approved. All source mutation routes remain gated.

## Target Gantt read parity — 2026-08-18

The source `/api/project-tasks/gantt/:id_project` route is represented by
`GET /api/v2/project-management/projects/{projectId}/gantt`. The target uses
the target `pm_project.id` key and reads the existing target task,
assignee/dependency data; it does not assume `id_project` is a TFS GUID.

The target UI preserves the source Gantt concerns: date range padding,
hierarchical task labels, planned bars, progress fill, status/overdue colors,
milestone rendering and dependency listing. Selecting a bar opens the same
read-only target task detail. No date/progress/reorder/dependency mutation is
exposed.

## Target weekly Summary read parity — 2026-08-18

| Source route | Target route | Boundary |
|---|---|---|
| `/api/project-tasks/summaries` | `/api/v2/project-management/summaries` | Paged stored-row read with year/week/project/customer/PM/section/status filters |
| `/api/project-tasks/summary/:id` | `/api/v2/project-management/summaries/{summaryId}` | Visible-row detail read |
| `/api/project-tasks/summary-customers` | `/api/v2/project-management/summary-customers` | Active target project customers |
| `/api/project-tasks/summary-projects` | `/api/v2/project-management/summary-projects` | Active target project combobox options |

The target summary screen preserves the source columns for week, PM,
customer, project, Plan, Actual, section, dates, notes, resources and updater.
The source role fallback and previous-week inheritance/materialization are not
silently recreated because no target business-user mapping or approved write
contract exists. Target rows are read-only and no summary mutation route is
exposed.

## Target task export parity — 2026-08-18

The source `GET /api/project-tasks/export/:projectId?format=json|csv` is
represented by `GET /api/v2/project-management/projects/{projectId}/export`.
Both formats preserve task code/name/description, planned dates, duration,
progress, status, priority, assignees and predecessor links. The target adds
no import, template, CRUD or reorder behavior.

## Target PMBOK sheet parity — 2026-08-17

The source `PM_SHEETS` order is preserved for the target read surface:

`Charter` → `Stakeholder` → `Resource & RACI` → `Cost & Budget` → `Risk` → `Quality` → `Communication` → `Change Log`.

Source `Tổng quan` is represented by the target PM Flow above the PMBOK
section, and source `WBS` is represented by the target WBS section on the same
project screen. The target PMBOK sheet bar therefore contains the eight PMBOK
data sheets without duplicating those parent sections.

Each sheet is read-only and renders only the corresponding target PMBOK DTO.
The status dot is copied from the existing target `buildFlow` status for the
same source key. No editor, POST, PUT or DELETE behavior is exposed.

## Source screen

Source of truth: `FiinGroup.Jarvis/pages/projects/projectmanagement.html` and `projectmanagement.js`.

| Sheet trên UI Jarvis | Source API surface | Dữ liệu chính | Target hiện tại |
|---|---|---|---|
| Tổng quan | `GET /api/pm-flow/:ref` | flow PMBOK, task, cost/cache và trạng thái section | Có shell; chưa có Jarvis DB read model |
| Charter | `/api/pm-project-charter/:projectId` | charter project, mục tiêu, phạm vi, giả định | Chưa chuyển |
| Stakeholder | `/api/pm-project-stakeholder/...` | stakeholder, contact, role, influence/interest | Chưa chuyển |
| WBS | `/api/project-tasks/...` | task, parent-child, assignee, dependency, progress | Có TFS projection; local WBS chưa chuyển |
| Resource & RACI | `/api/pm-project-resource/...` | resource allocation, RACI | Chưa chuyển |
| Cost & Budget | `/api/pm-cost-plan/...` và project cost routes | kế hoạch chi phí, actual/cache | Chưa chuyển |
| Risk | `/api/pm-project-risk/...` | risk register, owner, response, status | Chưa chuyển |
| Quality | `/api/pm-project-quality/...` | quality criteria, DoD | Chưa chuyển |
| Communication | `/api/pm-project-communication/...` | communication activity/register | Chưa chuyển |
| Change Log | `/api/pm-project-change/...` | change register và journal | Chưa chuyển |

## Backend source behavior

- `projectmanagement.js` tải dữ liệu theo sheet sau khi project được chọn.
- Nhiều sheet có cả GET, POST, PUT và DELETE; đây không phải read-only screens.
- Permission được kiểm tra ở middleware/route và một số thao tác có giới hạn theo owner/role.
- `pm-flow` có cơ chế soft-missing cho một số bảng PMBOK chưa được tạo, trả trạng thái `na`; trạng thái này không được chuyển thành dữ liệu rỗng giả.
- WBS có thêm workflow progress, dates, reorder, baseline, critical path, comments, attachments, activity log và import/export.

## Target migration order

Sau khi có database clone/read-only và mapping project được phê duyệt:

1. Read-only `pm_project` + `pm-flow` để khớp overview.
2. Read-only task/assignee/dependency để khớp WBS.
3. Charter và stakeholder.
4. Resource/RACI và cost.
5. Risk, quality, communication và change log.
6. Mutation theo từng sheet với permission matrix, audit và rollback.

## Current boundary

Target không gọi các API `/api/pm-*` của Jarvis qua proxy và không tạo dữ liệu PMBOK giả. TFS chỉ cung cấp project/team/iteration/work item; nó không cung cấp toàn bộ dữ liệu của các sheet trên.

## Target resource workload parity - 2026-08-18

Source: `GET /api/project-tasks/resources/workload`.

Target: `GET /api/v2/project-management/workload?projectId=&startDate=&endDate=`.

The target preserves the source period, working-day, assignee grouping and
task-level workload shape using only target PM tables. Source-only `users`, HR
holiday joins and non-admin identity filtering are not fabricated in the
target projection. The UI exposes the same read-only workload counts and the
task list per assignee.

## Target project payments parity - 2026-08-18

Source: `GET /api/pm-projects/:projectId/payments`.

Target: `GET /api/v2/project-management/projects/{projectId}/payments`.

The target preserves the visible, non-deleted payment rows and document
counts. It uses the target project record key and does not invent commission,
approval or payment mutation behavior.

## Target project-list filter parity - 2026-08-18

Source: Jarvis `GET /api/pm-projects` filters `pm`, `customer`,
`project_code`, `annex_no`, `status` and related project fields.

Target: local workspace filters over `GET /api/v2/project-management/projects`.

The target keeps filtering read-only and does not add source-only HR/product
joins.

## Target project contract-field parity - 2026-08-18

Source: `pm_project` fields from Jarvis project/payment/flow projections.

Target: `ProjectManagementProject` fields returned by the existing target
project, summary and workspace reads.

The UI now displays the source-defined contract and maintenance details without
inventing a new workflow or enabling mutation.

## Target payment document metadata parity - 2026-08-18

Source: `GET /api/pm-projects/payments/:paymentId/docs`.

Target: `GET /api/v2/project-management/payments/{paymentId}/documents`.

The target preserves document metadata and source status codes without serving
attachments or enabling document mutation.

## Target commission parity - 2026-08-18

Source: `GET /api/pm-project-commissions` filtered by project/payment.

Target: `GET /api/v2/project-management/projects/{projectId}/commissions`.

The target preserves visible commission/payment linkage and source status codes
without source user joins or mutation behavior.

## Target project requests parity - 2026-08-18

Source: `GET /api/project-requests` with `id_project` filtering.

Target: `GET /api/v2/project-management/projects/{projectId}/requests`.

The target preserves visible request fields and source status codes while
omitting HR/user display joins. Approve, reject, create, update and delete
remain gated.

## Target PDCA parity - 2026-08-18

Source: `GET /api/pdca` with `id_project` filtering.

Target: `GET /api/v2/project-management/projects/{projectId}/pdca`.

The target preserves visible report date, reporter, issue, description,
solution, process status/date, fault members and notes. It excludes the
source HR project-name joins and leaves all PDCA mutations gated.

## Target other project cost parity - 2026-08-18

Source: `GET /api/cost-other` with `id_project` filtering.

Target: `GET /api/v2/project-management/projects/{projectId}/costs-other`.

The target preserves visible cost type, phase, amount, product type, executor
notes, status, remarks and update timestamp. It intentionally excludes the
source encrypted member-cost and finance aggregations.

## Acceptance evidence required

Mỗi sheet chỉ được mở khi có:

- source response mẫu đã loại bỏ dữ liệu nhạy cảm;
- bảng/column query mapping;
- permission matrix;
- target DTO/API contract;
- UI comparison với source;
- test empty/forbidden/error và mutation rollback nếu có ghi.
