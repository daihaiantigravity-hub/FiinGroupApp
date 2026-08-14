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
