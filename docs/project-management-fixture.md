# Project-management local fixture

## Mục đích

Fixture này chỉ dùng để kiểm thử mapping và giao diện local của `FiinGroupApp`.
Nó được đối chiếu từ schema Jarvis, nhưng toàn bộ giá trị project/task bên dưới là
dữ liệu giả. Fixture không phải snapshot production và không được dùng để suy ra
dữ liệu thật của công ty.

## Nguồn đã đối chiếu

- `FiinGroup.Jarvis/server/migrations/005_recreate_pm_project.sql`
- `FiinGroup.Jarvis/server/migrations/007_pm_project_task.sql`
- `FiinGroup.Jarvis/server/migrations/031_pm_task_plan.sql`
- `FiinGroup.Jarvis/database/jarvis_tfs_bootstrap.sql`
- `FiinGroup.Jarvis/server/routes/project-tasks.js`

`database/jarvis_tfs_bootstrap.sql` được source ghi rõ là bootstrap TEST/DEVELOPMENT.
File `006_restore_pm_project_data.sql` chứa dữ liệu nghiệp vụ tĩnh của Jarvis nên
không được import vào database mới trong batch này.

## Bảng đã xác nhận

| Nhóm | Bảng source | Vai trò | Trạng thái target |
|---|---|---|---|
| Project | `pm_project` | Hợp đồng/phụ lục và thông tin project | Chưa chuyển business store |
| Task | `pm_project_task` | WBS, task, ngày, tiến độ, trạng thái | Đang đọc work item từ TFS |
| Assignment | `pm_task_assignee` | Nhiều người thực hiện một task | Chưa chuyển |
| Dependency | `pm_task_dependency` | Quan hệ phụ thuộc giữa task | Chưa chuyển |
| Audit | `pm_task_log` | Lịch sử thay đổi trường task | Chưa chuyển |
| Weekly plan | `pm_task_plan` | Weekly progress và next plan | Chưa chuyển |
| Summary | `pm_project_summary` | Tổng hợp tiến độ theo tuần | Chưa chuyển |

Các bảng chi phí, thanh toán, baseline, comment, attachment, PMBOK và HR không nằm
trong fixture đầu tiên vì chưa có quyền đọc business database và chưa có mapping
được owner phê duyệt.

## Cách dùng

SQL nằm tại:

`backend/Database/Fixtures/project-management-local-fixture.sql`

Đây là file kiểm thử thủ công, không được API tự động chạy khi khởi động. Chỉ import
vào một database disposable/local đã được xác nhận là không phải Jarvis và không phải
production. Sau khi test phải xóa database disposable theo runbook của môi trường.

## Ranh giới dữ liệu

- Không dùng fixture để cấp quyền, đăng nhập hoặc tạo identity.
- Không coi `pm_project.id_project` là TFS project GUID.
- Không coi `pm_project_task.id` là TFS work item ID.
- Không bật các nút progress, baseline, delete, import/export chỉ vì fixture có dữ liệu.
- Khi chuyển business store thật, phải có mapping project, DTO, permission matrix,
  source query snapshot và rollback note riêng theo AI-DLC.

## Target-aligned workspace fixture

The first fixture file predates the target migration and intentionally creates
`FiinGroupApp.ProjectManagementFixture`; it is not compatible with the target
reader because its project primary key is `id_project`. For the target API/UI,
use:

`backend/Database/Fixtures/project-management-target-fixture.sql`

This second fixture assumes migration `003_project_management_core` has already
been applied to the explicitly confirmed `FiinGroupApp.ProjectManagement`
database. It inserts only synthetic rows marked `FIXTURE-PM-*` and covers all
seven target core tables: project, task, assignee, dependency, task log, weekly
plan and project summary. It is repeatable on a disposable target database and
does not create a TFS mapping. The target screen is available at
`/projectmanagement-local` and is read-only.

## Target Baseline fixture

After migration `005_project_management_baseline_read`, the optional fixture
`backend/Database/Fixtures/project-management-baseline-fixture.sql` adds three
synthetic planned task rows for `FIXTURE-PM-001` and marks
`Baseline 2026-08-01` as the active baseline. It is repeatable on the
disposable target database and supports only the read-only baseline list and
comparison panel at `/projectmanagement-local`.

The target query preserves the source planned/actual date, duration and
`DATEDIFF` variance behavior. No baseline create, activate, delete or Jarvis/
TFS mapping operation is enabled.

## Target collaboration fixture

After migration `006_project_management_collaboration_read`, the optional
`backend/Database/Fixtures/project-management-collaboration-fixture.sql`
adds synthetic comments/replies, attachment metadata and activity entries for
`FIXTURE-PM-001`. The target project screen loads these records when a task is
selected and shows the project activity log on demand.

The fixture does not upload or create a real file; its attachment path is a
synthetic display value. It does not create target users or map Jarvis users,
and all collaboration controls remain read-only.

The fixture SQL deletes only rows carrying its own `FIXTURE-PM-*` project marker
before reinserting them. Review the target database name before running it; do
not use it against Jarvis or production.

## Optional PMBOK fixture

After migration `004_project_management_pmbok_core` is applied and the core
fixture has created project rows `9901`/`9902`, the PMBOK fixture can be applied:

`backend/Database/Fixtures/project-management-pmbok-fixture.sql`

It fills only target synthetic rows for charter, stakeholders, resources/RACI,
risk, cost, quality/DoD, communication and change log. The API exposes these
rows only when `ProjectManagement:PmbokEnabled=true`; all PMBOK operations are
read-only in this slice.

The PMBOK target screen uses the source sheet order for these eight data
sections. Source `Tổng quan` is shown by target PM Flow and source `WBS` by the
target WBS section; selecting a PMBOK sheet only changes the read-only panel
shown.

The target fixture already contains task durations and dependencies, so the
target `/projectmanagement-local` screen can validate the source-aligned
read-only Critical Path calculation without adding synthetic tables or writes.
The same rows validate the target read-only Gantt view: planned dates,
hierarchy, progress, assignees and dependency listing.

## Target Task Plan views

The target read-only Task Plan surface is available at:

- `/task-plan-list-local` for the paged list and filters;
- `/task-plan-local` for the selected-week project grouping.

Both routes read `GET /api/v2/project-management/task-plans` from the explicitly
configured target database. They never call Jarvis `/api/task-plans` and do not
enable the source save-batch, delete or inherited-plan behavior. The fixture
rows are suitable only for validating these read views on a disposable target
database.
The target project summary screen is available at `/project-summary-local`.
It aggregates only the target core fixture tables and remains read-only; it
does not reproduce Jarvis `pm-flow` earned-value or finance/cost-cache data.

Task Plan rows expose the target `source_plan_id` and `created_at` metadata in
the read contract. Clicking a row in either target Task Plan view opens its
detail panel; the panel is for inspection only and does not implement the
source previous-week inheritance, save, delete or approval behavior.

The same core fixture summary rows validate the target weekly Summary history
read slice on `/project-summary-local`. The screen reads
`GET /api/v2/project-management/summaries` with source-aligned filters and
pagination; it does not materialize inherited rows and does not write
`pm_project_summary`.

The target fixture also contains summary row `69904`, a synthetic
`section_type=2` plan for week 35 without a matching week-35 progress row.
Selecting 2026/W35 in the Summary screen validates the read-only `Kế thừa`
preview. The row is only a disposable fixture marker and is never copied by
the application.

In `/task-plan-local`, an unmaterialized previous-week Next Plan is shown as a
read-only `Kế thừa` preview for the selected week. It is not inserted into
`pm_task_plan`; rows already carrying `source_plan_id` are not duplicated.

The week view provides previous/next ISO-week navigation, displays the Monday
to Sunday date range and separates `Weekly progress` from `Next plan` for each
project. These controls only change the read query.

## Target PM Flow

`/projectmanagement-local` also shows the 11-step PM Flow read projection.
Task/WBS, schedule, dependency, assignment, weekly plan, summary and progress
cards are calculated from the target core workspace. PMBOK-dependent cards remain
`Chưa tải PMBOK` until the optional PMBOK endpoint is loaded. The screen is
read-only and does not imply a Jarvis/TFS project mapping or enable mutations.

## Target commission fixture

After migration `011_project_management_commission_read`, the target fixture
adds three synthetic commission rows linked to the payment fixture. The UI
shows payment linkage and status read-only without executing payment actions.

## Target project requests fixture

After migration `010_project_management_requests_read`, the target fixture
adds one completed and one pending synthetic project request. The workspace
shows request content and status read-only without enabling approval actions.

## Target PDCA fixture

After migration `009_project_management_pdca_read`, the target fixture adds
two synthetic PDCA rows for the fixture projects. The project workspace shows
their issue, description, solution and process status read-only.

## Target other project cost fixture

After migration `008_project_management_cost_other_read`, the target fixture
adds three synthetic other-cost rows for the fixture projects. These rows are
shown separately from the PMBOK cost plan and do not represent HR, finance or
production cost data.

## Target contract-field fixture coverage

The target fixture includes synthetic sign/acceptance dates, warranty period,
maintenance percentage, next action and configured commission values so the
project contract panel can be verified. These values are disposable test data.

## Target project payments fixture

After migration `007_project_management_payments_read`, the target fixture
adds three synthetic payment rows and two payment-document metadata rows for
the fixture projects. The payment panel is read-only: it shows dates, amount,
status, remarks and document counts without creating files or enabling payment
mutations.
