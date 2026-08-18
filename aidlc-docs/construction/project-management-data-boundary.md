# Project Management Data Boundary

## Quyết định hiện tại

`FiinGroupApp` tiếp tục dùng TFS làm nguồn đọc cho phần dữ liệu đã được phê duyệt. Target đã có migration schema riêng cho business store PM cốt lõi, nhưng migration chưa được chạy tự động và chưa được nạp dữ liệu/mapping từ Jarvis.

Runbook: `docs/project-management-migration-runbook.md`.

## Mapping source-to-target

| Năng lực | Source Jarvis | Target hiện tại | Trạng thái |
|---|---|---|---|
| Chọn project, team, iteration | TFS adapter + session TFS | `/api/v2/tfs/...` | Đã có read-only |
| Danh sách work item | TFS work item API | `project-tasks` | Đã có projection read-only và WBS cơ bản |
| Tạo/sửa work item | TFS JSON Patch | Target TFS write boundary | Có contract, mặc định tắt |
| Project nghiệp vụ | `pm_project` | target `ProjectManagement` read workspace | Đã có read-only target slice |
| WBS đầy đủ/assignee/dependency | `pm_project_task` + relation tables | target workspace + task detail | Đã có read-only target slice |
| Progress/status audit | task, log, activity log và TFS sync | Chưa có local audit store | Chưa chuyển đầy đủ |
| Baseline/critical path | baseline và local computation | target baseline comparison + critical path read slice | Read-only; writes gated |
| Summary/weekly plan/PMBOK | summary, plan, charter và optional tables | target summary/task-plan/PMBOK read slices | Read-only; source mapping/mutation gated |
| Comment/attachment | local Jarvis tables/storage | target comments/replies + attachment metadata read slice | Read-only; writes/storage gated |

### Không được rút gọn progress thành một PATCH TFS đơn lẻ

Theo source Jarvis, progress là workflow gồm local status, local audit, note và TFS synchronization. Vì target chưa có các bảng local tương ứng, target chỉ được hiển thị progress projection từ TFS; không được tự ghi progress hoặc giả lập audit nếu chưa mở một business data unit riêng.

## Không được suy diễn

- Không coi TFS project GUID là `pm_project.id_project`.
- Không coi work item ID là `pm_project_task.id`.
- Không tạo số liệu nhân sự, chi phí, doanh thu, baseline hoặc PMBOK khi chưa có source data.
- Không copy credentials hoặc payload nhạy cảm từ Jarvis vào target repository.
- Không chạy migration source hoặc gọi workflow sync ghi vào Jarvis trong môi trường hiện tại.

## Điều kiện để mở batch business database

Chỉ bắt đầu thiết kế migration target sau khi có đủ:

1. Database clone/snapshot hoặc quyền read-only đã được cấp.
2. Danh sách project mapping giữa TFS và Jarvis được owner xác nhận.
3. Quyết định target là mirror, read model hay hệ thống nghiệp vụ mới.
4. Permission matrix cho read/create/edit/delete/progress/baseline/comment/import/export.
5. Quy tắc conflict và rollback khi TFS và target cùng thay đổi.
6. Dataset kiểm thử đã loại bỏ dữ liệu nhạy cảm hoặc được phê duyệt sử dụng nội bộ.

## Unit tiếp theo sau blocker

Khi các điều kiện trên được đáp ứng, thứ tự đối chiếu là:

1. `pm_project` và mapping project.
2. `pm_project_task`, parent-child và task fields.
3. assignee/dependency/status/progress.
4. log/activity và revision conflict.
5. baseline/critical path.
6. comments/attachments/weekly summaries.

Mỗi bước phải có source query snapshot, DTO mapping, API contract, test dữ liệu null/quyền hạn/xung đột và rollback note trước khi code.

## Target PM read contract — 2026-08-14

Target đã có schema/repository read contract ban đầu cho `pm_project` và
`pm_project_task`; contract này chỉ hoạt động khi `ProjectManagement:Enabled=true`
và có connection string riêng. Nó chưa được nối vào TFS project selector vì
`pm_project.id_project` chưa được phê duyệt là mapping với TFS project GUID.

## Target-only read workspace — 2026-08-17

The target PM repository now exposes an explicit read-only workspace endpoint:

`GET /api/v2/project-management/projects/{projectId}/workspace`

The workspace joins only the seven tables already present in target migration
`003_project_management_core`: project, task, assignee, dependency, task log,
weekly plan and project summary. The UI is intentionally a separate
`/projectmanagement-local` screen so it cannot be mistaken for the TFS project
selector. It uses the same authenticated PM read permission and does not write
TFS, Jarvis or the target business store.

The optional target-aligned fixture is synthetic and disposable. Its rows are
not a migration snapshot, do not prove a TFS mapping and must not be used to
enable progress, comments, attachments, PMBOK or other mutations.
Baseline comparison is now available only as a target read slice; baseline
creation, activation and deletion remain gated.

## Target-only PMBOK read slice — 2026-08-17

Migration `004_project_management_pmbok_core` and
`GET /api/v2/project-management/projects/{projectId}/pmbok` add an explicit
read-only target model for the source-defined PMBOK tables. The endpoint is
independently gated by `ProjectManagement:PmbokEnabled` and returns an explicit
schema-unavailable error when migration `004` has not been applied.

The `/projectmanagement-local` screen loads PMBOK on demand and displays the
synthetic marker/boundary. This is a target validation read model, not a claim
that Jarvis PMBOK data has been migrated. Approval workflow, CRUD, baseline
writes, comment/attachment writes, activity-log writes and TFS mapping remain
unavailable.

## Target-only Task Plan read slice — 2026-08-17

`GET /api/v2/project-management/task-plans` exposes a paged, filterable read
projection over target `pm_task_plan`, with optional project/customer/PM,
year/week, section and status filters. `/task-plan-list-local` and
`/task-plan-local` are explicitly target-local screens; they do not call the
Jarvis Task Plan routes and do not enable save, delete, inheritance or weekly
report mutations. The target DTO preserves `source_plan_id` and `created_at`
for read-only lineage/metadata inspection; it does not materialize Jarvis's
previous-week inheritance behavior. Synthetic fixture rows remain disposable
and do not prove a business-data migration or a TFS mapping.

The target week view may preview unmaterialized previous-week `Next plan` rows
as `Weekly progress · Kế thừa`. This is computed in the frontend from two
read-only target queries, excludes rows already referenced by current-week
`source_plan_id`, and never inserts or updates a target row.

The target week screen also exposes source-aligned week navigation, ISO week
date range and separate `Weekly progress`/`Next plan` sections per project.
These are presentation/read-query concerns only; no source edit controls,
weekly save or delete behavior is enabled.

## Target-only project summary read slice — 2026-08-17

`GET /api/v2/project-management/summary` aggregates only target
`pm_project`, `pm_project_task`, `pm_task_dependency`, `pm_task_plan` and the
latest active `pm_project_summary` row. `/project-summary-local` displays task
counts, completed/active/overdue counts, average progress, latest Plan/Actual,
budget and navigation to the target workspace. It does not reproduce Jarvis
`pm-flow` calculations that depend on Redmine issues, cost caches, HR or
finance tables, and it has no mutation behavior.

## Target-only PM Flow read slice — 2026-08-17

The target `/projectmanagement-local` screen now displays the source-aligned
11-step PM Flow as a read-only target projection. WBS, schedule, dependency,
assignment, task progress, weekly plan and summary metrics come only from the
target core workspace. Charter, stakeholder, resource/RACI, cost plan, risk,
quality/DoD, communication and change-log steps come only from the optional
target PMBOK workspace.

PMBOK-dependent steps remain explicitly `Chưa tải PMBOK` until the user loads
the optional endpoint. The projection does not fall back to Jarvis, Redmine
issues, cost caches, HR/finance or meeting tables, and it does not enable PM
Flow navigation, CRUD, approval, progress, baseline, comment or TFS writes.

## Target PMBOK sheet-bar parity — 2026-08-17

The target PMBOK read model now follows the source sheet navigation for
`Charter`, `Stakeholder`, `Resource & RACI`, `Cost & Budget`, `Risk`, `Quality`,
`Communication` and `Change Log`. Source `Tổng quan` remains the target PM Flow
section and source `WBS` remains the target WBS section; neither is duplicated
inside the PMBOK data panel.

The target tab status dots reuse the already implemented target PM Flow status
projection. Selecting a tab only changes which existing read DTO is rendered;
it does not add source editor controls or any target/Jarvis/TFS mutation.

## Target Baseline read slice — 2026-08-17

Migration `005_project_management_baseline_read` adds the source-aligned
`pm_task_baseline` read table and the nullable `pm_project.active_baseline`
marker to the target schema. The target exposes:

- `GET /api/v2/project-management/projects/{projectId}/baselines` for the
  source-style grouped baseline list;
- `GET /api/v2/project-management/projects/{projectId}/baselines/compare?baselineName=...`
  for task-level planned/actual dates, duration and `DATEDIFF` variances.

The comparison preserves the source summary semantics: total tasks, ahead,
on-time, behind, average start variance and average end variance. It accepts
the source `baseline_name` query spelling as a compatibility alias, but the
target client uses camel-case `baselineName`. The UI has no create, activate,
delete or other mutation controls. The optional baseline fixture contains only
synthetic `FIXTURE-PM-*` data and does not establish a Jarvis/TFS mapping.

## Target Critical Path read slice — 2026-08-17

`GET /api/v2/project-management/projects/{projectId}/critical-path` ports the
source Jarvis Critical Path calculation over target `pm_project_task` and
`pm_task_dependency`. It preserves the source forward pass, backward pass,
Finish-to-Start assumption and zero-duration fallback of one day.

The target UI exposes the calculation and the source-style path summary as
read-only WBS analysis. The source persistence action that writes
`pm_project_task.is_critical` remains gated; this endpoint does not write the
target store, Jarvis or TFS.

## Target collaboration read slice — 2026-08-17

Migration `006_project_management_collaboration_read` adds target read tables
derived from the source `013_task_comments_attachments.sql` and
`015_task_activity_log.sql`. The target exposes:

- `GET /api/v2/project-management/tasks/{taskId}/comments` and
  `/api/v2/project-management/comments/{commentId}/replies`;
- `GET /api/v2/project-management/tasks/{taskId}/attachments`;
- `GET /api/v2/project-management/projects/{projectId}/activity-log` and
  `/api/v2/project-management/tasks/{taskId}/activity-log`.

The target preserves comment threading, attachment metadata and activity field
changes. It intentionally returns the source `user_login` only because the
target identity store is separate and no business-user mapping was approved.
No POST, PUT, DELETE, upload or file-storage behavior is exposed. Synthetic
rows are marked by the existing `FIXTURE-PM-*` project fixture boundary.

## Target Gantt read slice — 2026-08-18

`GET /api/v2/project-management/projects/{projectId}/gantt` ports the source
`GET /api/project-tasks/gantt/:id_project` using only the target project,
task, assignee and dependency projection. The target Gantt retains task
hierarchy, planned/actual dates, duration, progress, priority, task type,
status, assignee logins and dependency links.

The target route uses the target `pm_project.id` as its project key; it does
not infer or expose a TFS GUID mapping from `pm_project.id_project`. The UI is
read-only and does not enable task date/progress/reorder writes or dependency
mutation. Resource Workload remains gated because the source calculation also
depends on `users` and `hr_holiday`, which have no approved target mapping.

## Target weekly Summary read slice — 2026-08-18

The target now exposes the materialized Jarvis summary list as a paged,
read-only projection:

- `GET /api/v2/project-management/summaries` supports year, week, project,
  customer, PM, section and active-status filters;
- `GET /api/v2/project-management/summaries/{summaryId}` reads one visible
  summary row;
- `GET /api/v2/project-management/summary-customers` and
  `GET /api/v2/project-management/summary-projects` support the source-style
  filter controls.

The query joins target `pm_project` metadata using the target project record
key and preserves `pm_project_summary` Plan/Actual, section, entry, dates,
notes, resources and updater fields. It does not infer a TFS GUID mapping or
join the Jarvis `users` table. Jarvis's previous-week inheritance and
materialization behavior remains out of scope: the target returns stored rows
only and never inserts, updates or soft-deletes a summary. The existing
project summary screen now includes the source-style weekly history table,
filters and pagination.

When year, week and the progress section are selected, the target also issues
a second read for same-week `section_type=2` rows and shows unmaterialized
project rows as a synthetic `Kế thừa` preview. It uses the target project key
to avoid duplicating a stored progress row and uses the existing target latest
Actual/average task progress for the preview value. The preview is never
inserted into `pm_project_summary`.

## Target task export read slice — 2026-08-18

The target PM workspace now exposes the source GET export behavior at
`GET /api/v2/project-management/projects/{projectId}/export?format=csv|json`.
It reads the existing target project/task/assignee/dependency projection and
returns UTF-8 CSV (with Excel BOM) or JSON task records. Import, template
download, task creation/update/delete and reorder remain gated; export does
not write Jarvis, TFS or the target store.

## Target contract-field fixture coverage - 2026-08-18

The target-only fixture now populates representative sign, acceptance,
warranty, maintenance, next-action and configured commission values for both
synthetic projects. These values exist only to exercise the source-aligned
display fields and must not be treated as production project data.

## Target project-list filter parity - 2026-08-18

The local target workspace now mirrors the source project-list filter intent
with client-side filters over the already loaded target projection: project
code/customer/annex search, PM and status. This does not broaden the source
query, create a new permission rule or mutate project data.

## Target project contract-field parity - 2026-08-18

The target project projection now preserves Jarvis-defined contract fields:
contract type, budget percentage, sign/acceptance dates, warranty period/end,
maintenance percentage, next action date, remarks and configured commission
values. These are read-only display fields from `pm_project`; no status,
contract or finance mutation is introduced.

## Target payment document metadata read slice - 2026-08-18

The target exposes `GET /api/v2/project-management/payments/{paymentId}/documents`,
matching Jarvis `GET /api/pm-projects/payments/:paymentId/docs`. It reads the
target payment-document projection created by migration 007 and preserves
document name, status, attachment metadata and remarks. The UI only displays
metadata; upload, download and document mutations remain gated.

## Target commission read slice - 2026-08-18

The target exposes `GET /api/v2/project-management/projects/{projectId}/commissions`,
matching the project-scoped read from Jarvis `GET /api/pm-project-commissions`.
Migration 011 defines the target commission projection linked to target payment
rows. The response preserves percentage, amount, status, expected/actual dates,
recipient information and remarks. It does not calculate or execute payment and
all commission mutations remain gated.

## Target project requests read slice - 2026-08-18

The target exposes `GET /api/v2/project-management/projects/{projectId}/requests`,
matching the project-filtered read of Jarvis `GET /api/project-requests`.
Migration 010 defines the target request projection and the fixture adds one
completed and one pending synthetic request. The target preserves request
type, title, content, amount, member/manager/approver, dates and status; it
does not enable approval or request mutations.

## Target PDCA read slice - 2026-08-18

The target exposes `GET /api/v2/project-management/projects/{projectId}/pdca`,
matching the project-filtered read behavior of Jarvis `GET /api/pdca`. Migration
009 defines the target PDCA projection and the fixture adds synthetic issue,
description, solution and process-status rows. Reporter and fault-member
values remain logins only; no HR user join is fabricated. PDCA mutations remain
gated.

## Target other project cost read slice - 2026-08-18

The target exposes `GET /api/v2/project-management/projects/{projectId}/costs-other`,
matching Jarvis `GET /api/cost-other?id_project=...` for the project-scoped
read. Migration 008 defines the target `pm_project_cost_other` projection and
the fixture adds synthetic cloud, license and device rows. The UI keeps this
separate from PMBOK Cost Plan and does not include encrypted member cost,
cost-cache, HR or finance data. All cost mutations remain gated.

## Target project payments read slice - 2026-08-18

The target now exposes `GET /api/v2/project-management/projects/{projectId}/payments`,
matching Jarvis `GET /api/pm-projects/:projectId/payments`. Migration 007
defines target-only payment and payment-document projections. The response
preserves payment number, dates, percentage, amount, status, actual payment
date, remarks and document count. Payment creation/update/delete and document
download remain gated; the fixture is synthetic and must be applied manually.

## Target resource workload read slice - 2026-08-18

The target exposes the source `GET /api/project-tasks/resources/workload`
behavior through `GET /api/v2/project-management/workload`. It accepts the
optional `projectId`, `startDate` and `endDate` filters, groups overlapping
non-hidden tasks by `pm_task_assignee.assignee`, and preserves total, active,
completed, overdue, average-progress and utilization fields. The target
working-day calculation matches the source weekday rule; no HR holiday data is
invented because that table is outside the target PM store. The projection is
read-only and never changes assignments or task records.
