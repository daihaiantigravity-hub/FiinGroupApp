# TFS Project Management UI

## Mục tiêu

Màn `/projects` của React được tổ chức theo bố cục quản lý dự án trong
`FiinGroup.Jarvis/pages/projects/projectmanagement.html`, nhưng chỉ triển khai
phần đọc dữ liệu TFS đã có contract ở API v2.

## Mapping giao diện

| Jarvis | React target | Trạng thái |
| --- | --- | --- |
| Tiêu đề “Quản lý dự án” và bộ chọn dự án | `.projectmanagement-head` + `.projectmanagement-select` | Đã căn theo Jarvis |
| `pmSheets` | Thanh sheet Tổng quan, Charter, Stakeholder, WBS, Resource & RACI, Cost & Budget, Risk, Quality, Communication, Change Log | Đã căn theo Jarvis; sheet thiếu DB hiển thị khóa |
| `project-tasks.html` header/tabs/toolbar | `.page-header-wrapper`, tabs Tổng hợp/Tiến độ dự án, toolbar filter và view toggle | Đã căn theo Jarvis; Tổng hợp/Resource chờ nguồn DB/API |
| Project summary | Collection, trạng thái, project ID, KPI số team/work item | Đã có |
| Team/iteration/project data | Bảng đọc-only lấy từ `/api/v2/tfs/projects/{id}/...`, có xem chi tiết work item | Đã có |
| WBS / `project-tasks` | TFS WBS read-only theo Iteration Path và `System.Parent`, có thống kê, bộ lọc và Gantt khi có ngày TFS | Đã có bản đầu; chưa có mutation |
| Charter, Stakeholder, Resource & RACI, Risk, Cost, Quality, Change Log | Chưa chuyển | Không triển khai khi chưa có DB Jarvis và contract được phê duyệt |

Các sheet PMBOK vẫn được hiển thị trong thanh sheet để giữ cấu trúc quen thuộc
của Jarvis, nhưng bị khóa và có tooltip giải thích lý do. Đây là boundary rõ
ràng giữa phần đã chuyển được (TFS read-only) và phần còn phụ thuộc Jarvis DB.

## Quy tắc tương thích

- `FiinGroup.Jarvis` chỉ là nguồn tham chiếu hành vi và giao diện; không sửa
  file trong repository đó.
- React gọi API TFS target bằng session TFS hiện tại và không gọi trực tiếp
  TFS từ trình duyệt.
- Dữ liệu trên màn này là read-only; chưa có thao tác tạo/sửa/xóa dự án,
  team, iteration hoặc work item.
- Lỗi API phải được hiển thị kèm error code để đối chiếu với backend và TFS.
- Chỉ mở các sheet đã có API; sheet chưa có nguồn dữ liệu phải hiển thị rõ
  trạng thái “chưa triển khai”, không hiển thị dữ liệu giả.
- WBS hiện là read-only projection từ TFS work items. Nó không được coi là
  bản thay thế hoàn chỉnh cho `project-tasks` của Jarvis, vốn còn có dữ liệu
  tiến độ, ngày tháng, baseline, resource workload và mutation trong DB.
- API WBS dùng `limit` và `offset`; giao diện tải theo từng nhóm tối đa 100
  work item để không tải toàn bộ project lớn trong một lần.
- Work item detail dùng endpoint riêng và chỉ hiển thị dữ liệu đọc từ TFS;
  modal không có hành động sửa/xóa.
- Mapping WBS bám theo `server/services/tfs-jarvis-mapper.js`: status dùng các mã
  `0/1/2/3`, progress dùng `CompletedWork/(CompletedWork+RemainingWork)` và
  fallback `100/50/0` theo status.
- Gantt dùng ngày theo thứ tự `StartDate` và
  `FinishDate → TargetDate → ClosedDate`; khi thiếu thì fallback từ
  `CreatedDate`/`ChangedDate` giống mapper Jarvis. Vùng hiển thị có padding
  `-7/+14 ngày` như Gantt của Jarvis.
- Tab `Tổng hợp` và chế độ `Resource` của `project-tasks` vẫn chưa bật
  vì phụ thuộc các API/DB Jarvis chưa có trong repository mới.

## Kiểm thử thủ công

1. Dùng Node.js 20.19+; chạy frontend với `VITE_AUTH_MODE=target-dev` và đăng nhập TFS.
2. Mở `/projects` hoặc `/projectmanagement`, xác nhận danh sách collection/project giống kết quả
   `GET /api/v2/tfs/projects`.
3. Chọn `FiinGroup.Jarvis` hoặc `FiinGate` và kiểm tra lần lượt các sheet
   Teams, Iterations, Work items.
4. Đổi project rồi quay lại từng sheet, xác nhận dữ liệu được tải lại theo
   project mới.
5. Mở WBS, xác nhận work items được nhóm theo Iteration Path và task con có
   thể hiện `System.Parent` nếu TFS trả về trường này.
6. Dùng ô tìm kiếm và bộ lọc iteration/trạng thái, xác nhận bảng và thống kê
   thay đổi đúng theo dữ liệu TFS đã tải.
7. Với project lớn, bấm “Tải thêm” và xác nhận offset tăng, dữ liệu cũ vẫn
   được giữ lại, không có bản ghi trùng trong danh sách.
8. Bấm mã work item, xác nhận modal chi tiết tải được và liên kết “Mở trên
   TFS” trỏ đến URL do TFS trả về.
9. Chuyển WBS sang Gantt; nếu có ngày TFS, xác nhận thanh hiển thị đúng
   khoảng ngày; nếu không có ngày, xác nhận thông báo rõ ràng.
10. Xác nhận WBS không có request mutation gửi đến Jarvis/TFS.
11. Xác nhận các sheet Charter, Stakeholder, Resource & RACI, Cost, Risk,
   Quality, Communication và Change Log hiển thị nhưng không thể mở.
12. Mở `/project-tasks`, chọn project và xác nhận màn hình bắt đầu ở sheet WBS.

## Definition of Done của slice UI

- UI compile với TypeScript strict.
- Không sửa `FiinGroup.Jarvis`.
- Có trạng thái loading, empty và error.
- Không dùng dữ liệu mock cho kết quả TFS.
- Chưa chuyển các màn PMBOK ghi dữ liệu khi chưa có quyền DB và yêu cầu
  nghiệp vụ được xác nhận.
