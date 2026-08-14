# Jarvis Project Backend Baseline

## Mục đích

Tài liệu này ghi nhận kết quả đọc tĩnh backend của `D:\DEV\FiinGroup.Jarvis` để làm nguồn đối chiếu cho module quản lý dự án và tiến độ dự án trong `FiinGroupApp`.

Đây là baseline từ source code và migration files, không phải xác nhận rằng toàn bộ bảng đã tồn tại hoặc có dữ liệu trong database runtime. Database nghiệp vụ Jarvis hiện chưa được cấp quyền đọc đầy đủ.

## Phạm vi source đã kiểm tra

- `server/routes/project-tasks.js`
- `server/routes/pm-flow.js`
- `server/services/tfs-work-item-sync.js`
- `server/migrations/004_pm_project.sql`, `005_recreate_pm_project.sql`
- `server/migrations/007_pm_project_task.sql`
- `server/migrations/013_task_comments_attachments.sql`
- `server/migrations/014_task_baseline.sql`
- `server/migrations/015_task_activity_log.sql`
- `server/migrations/017_add_plan_to_project_task.sql`
- `server/migrations/031_pm_task_plan.sql`
- `server/migrations/090_pm_phase0_charter.sql`
- `server/migrations/095_pm_sprint_baseline.sql`
- `server/migrations/097_tfs_jarvis_mapping.sql`

## Route và workflow chính

### `project-tasks`

Backend Jarvis dùng một route module lớn cho các nhóm chức năng sau:

| Nhóm | Route source | Nguồn dữ liệu/chức năng |
|---|---|---|
| Danh sách | `GET /api/project-tasks` | `pm_project_task`, project, assignee, dependency và user |
| Chi tiết | `GET /api/project-tasks/:id` | task, assignee, dependency, log liên quan |
| Tạo/sửa/xóa | `POST /api/project-tasks`, `PUT /:id`, `DELETE /:id` | Ghi database Jarvis; đồng bộ TFS nếu task có mapping |
| Tiến độ | `PUT /:id/progress`, `PUT /:id/dates` | Ghi local task, log thay đổi và cập nhật TFS |
| Gantt/WBS | `GET /gantt/:id_project`, `POST /reorder` | Cây task, parent-child, thứ tự và ngày |
| Critical path | `GET/POST /critical-path/:projectId` | Tính toán và lưu dữ liệu critical path local |
| Baseline | `GET/POST/DELETE /baselines/...`, `GET .../compare` | Snapshot và so sánh kế hoạch local |
| Trao đổi | `GET/POST/PUT/DELETE .../comments`, `.../attachments` | Comment, reply và file đính kèm local |
| Audit | `GET /activity-log/...` | `pm_task_activity_log` |
| Kế hoạch tuần | `GET/POST/PUT/DELETE /summaries...` | Summary/plan theo tuần và trạng thái audit |
| Tích hợp | `GET /calendar/holidays`, `/resources/workload`, `/redmine-issues`, `/sprints` | Lịch, nguồn lực, Redmine và sprint |
| Import/export | `/export/...`, `/import/...` | Chuyển dữ liệu task qua file, phụ thuộc quyền và DB local |

### `pm-flow`

`GET /api/pm-flow/:ref` là read model tổng hợp cho dòng chảy PMBOK. Route đọc task, Redmine issue, cost cache và các bảng PMBOK tùy chọn. Khi bảng tùy chọn không tồn tại, source có thể trả trạng thái không khả dụng thay vì coi đó là dữ liệu rỗng hợp lệ.

## Mô hình dữ liệu source

### Project và task core

`pm_project` là project nghiệp vụ của Jarvis, không đồng nhất với project GUID của TFS. Các trường chính gồm mã project, khách hàng, hợp đồng, ngân sách, ngày bắt đầu/kết thúc, trạng thái, nghiệm thu, bảo hành và ghi chú.

`pm_project_task` là task nghiệp vụ với các trường chính:

- `id_project`, `parent_id`, `task_code`, `task_name`, `description`, `product`
- ngày kế hoạch/thực tế, `duration`, `progress`, `priority`, `task_type`, `status`, `sort_order`
- `created_by`, timestamp
- các trường mở rộng phase 0: `effort`, `pj_id`, `issue_id`, `nghiep_vu`, `muc_code`, `phase`, `dept_role`, `is_critical`
- `plan` và `agile_sprint_id`

### Task relations và audit

- `pm_task_assignee`: nhiều người thực hiện một task, có role thực hiện/review/hỗ trợ.
- `pm_task_dependency`: quan hệ FS/SS/FF/SF và lag ngày.
- `pm_task_log`: lịch sử thay đổi trường và giá trị cũ/mới.
- `pm_task_comment`, `pm_task_attachment`: trao đổi và file đính kèm.
- `pm_task_activity_log`: audit action create/update/delete/status/progress/assignee/dependency/comment/attachment/baseline.
- `pm_task_baseline`: snapshot baseline; `pm_project.active_baseline` giữ baseline đang dùng.
- `pm_task_plan`: kế hoạch/tiến độ theo tuần, có section, entry, resource, audit và trạng thái.
- `pm_project_summary`: dữ liệu tổng hợp tiến độ/kế hoạch; source có migration bổ sung weekly section và audit.
- `pm_project_charter`: thông tin charter của project.

### TFS mapping

Migration `097_tfs_jarvis_mapping.sql` không tạo database TFS riêng. Source lưu metadata external trực tiếp trên bảng hiện hữu:

- `projects`: source system, collection, external project id, revision, URL, payload và thời điểm sync.
- `pm_project_task`: source system, collection, source project id, work item id, revision, URL, payload, generated fields và thời điểm sync.
- `agile_sprints`: metadata iteration/sprint tương tự.

Các unique index external source ngăn một nguồn TFS được map trùng vào cùng bản ghi local.

## TFS synchronization behavior

Khi tạo hoặc sửa task Jarvis đã map TFS, source cập nhật TFS trước hoặc trong cùng workflow tùy route, sau đó ghi local mapping. Update dùng revision guard; xung đột `409/412` được chuyển thành lỗi `TFS_REVISION_CONFLICT` để tránh ghi đè thay đổi mới hơn.

Progress/status được ánh xạ sang `System.State`, `CompletedWork` và `RemainingWork` khi field có trong work item. Xóa task trong route thông thường là soft delete local (`status=9`) và cập nhật TFS sang trạng thái `Removed`; không phải hard delete tùy ý.

### Workflow cập nhật tiến độ

Source route `PUT /api/project-tasks/:id/progress` thực hiện theo thứ tự nghiệp vụ:

1. Validate `progress` trong khoảng 0 đến 100 và đọc progress cũ từ `pm_project_task`.
2. Suy ra status local: 100 là hoàn thành, lớn hơn 0 là đang thực hiện, còn lại là chưa bắt đầu.
3. Cập nhật local task và ghi `pm_task_log` với người cập nhật, giá trị cũ/mới và note.
4. Ghi activity log cho hành động progress/status change.
5. Nếu task có TFS mapping, gọi TFS update với status và progress.
6. TFS sync chỉ cập nhật `CompletedWork/RemainingWork` khi work item có các field tương ứng; status phải đi qua mapping theo work item type.

Target hiện chưa có local `pm_project_task`, log hoặc mapping TFS-to-Jarvis nên không được gọi workflow này là đã chuyển đổi chỉ vì màn hình hiển thị phần trăm progress.

## Permission và ownership

Route yêu cầu authentication. Quyền nghiệp vụ source phân biệt admin/PM/assignee; quyền đọc và quyền sửa không tương đương. Tạo, sửa, xóa, progress, baseline, comment, attachment và import/export đều là các capability riêng cần kiểm tra theo source contract.

FiinGroupApp hiện chỉ có target identity store và TFS pilot permission. Chưa được phép coi quyền `TFS_READONLY` là quyền ghi các bảng PM nghiệp vụ Jarvis.

## Kết luận migration

1. TFS có thể là read source cho project, team, iteration và work item trong giai đoạn hiện tại.
2. TFS không thay thế `pm_project`, các quan hệ WBS, baseline, activity log, comment, attachment hoặc kế hoạch tuần của Jarvis.
3. Muốn chuyển đầy đủ màn hình `project-tasks` phải có quyền đọc database Jarvis hoặc một database clone/snapshot được phê duyệt.
4. Không được tạo schema target hoặc giả lập số liệu PMBOK chỉ từ tên bảng source.
5. Mọi bước ghi/sync hai chiều phải chờ phê duyệt ownership, mapping project TFS-to-Jarvis, permission matrix và rollback.

## Trạng thái xác minh

- Đã xác minh bằng source route và migration files.
- Chưa xác minh đầy đủ bằng database runtime nghiệp vụ Jarvis.
- Repository `FiinGroup.Jarvis` không bị sửa trong quá trình lập baseline này.
