# Project Management Data Boundary

## Quyết định hiện tại

`FiinGroupApp` tiếp tục dùng TFS làm nguồn đọc cho phần dữ liệu đã được phê duyệt. Không tạo migration business database trong batch này vì database nghiệp vụ Jarvis chưa có quyền đọc đầy đủ và chưa có quyết định chính thức về ownership/mapping.

## Mapping source-to-target

| Năng lực | Source Jarvis | Target hiện tại | Trạng thái |
|---|---|---|---|
| Chọn project, team, iteration | TFS adapter + session TFS | `/api/v2/tfs/...` | Đã có read-only |
| Danh sách work item | TFS work item API | `project-tasks` | Đã có projection read-only và WBS cơ bản |
| Tạo/sửa work item | TFS JSON Patch | Target TFS write boundary | Có contract, mặc định tắt |
| Project nghiệp vụ | `pm_project` | Chưa có target business store | Chưa chuyển |
| WBS đầy đủ/assignee/dependency | `pm_project_task` + relation tables | Chưa có target business store | Chưa chuyển |
| Progress/status audit | task, log, activity log và TFS sync | Chưa có local audit store | Chưa chuyển đầy đủ |
| Baseline/critical path | baseline và local computation | Chưa có | Gated |
| Summary/weekly plan/PMBOK | summary, plan, charter và optional tables | Chưa có | Gated |
| Comment/attachment | local Jarvis tables/storage | Chưa có | Gated |

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
