# TFS Project Management UI

## Mục tiêu

Hai màn `/projectmanagement` và `/project-tasks` của React được tổ chức theo bố cục quản lý dự án trong
`FiinGroup.Jarvis/pages/projects/projectmanagement.html`, nhưng chỉ triển khai
phần đọc dữ liệu TFS đã có contract ở API v2.

## Mapping giao diện

| Jarvis | React target | Trạng thái |
| --- | --- | --- |
| Tiêu đề “Quản lý dự án” và bộ chọn dự án | `.projectmanagement-head` + `.projectmanagement-select` | Đã căn theo Jarvis |
| `pmSheets` | Thanh sheet Tổng quan, Charter, Stakeholder, WBS, Resource & RACI, Cost & Budget, Risk, Quality, Communication, Change Log | Đã căn theo Jarvis; sheet thiếu DB bấm được và mở boundary popup |
| `project-tasks.html` header/tabs/toolbar | `.page-header-wrapper`, task toolbar, view toggle, Công cụ popover và `+ Thêm Task` | Đã căn theo trạng thái task view của Jarvis; Tổng hợp/Resource chờ nguồn DB/API |
| Project summary | Collection, trạng thái, project ID, KPI số team/work item | Đã có |
| Team/iteration/project data | Bảng đọc-only lấy từ `/api/v2/tfs/projects/{id}/...`, có xem chi tiết work item | Đã có |
| WBS / `project-tasks` | TFS WBS read-only theo Iteration Path và `System.Parent`, có thống kê, bộ lọc và Gantt khi có ngày TFS | Đã có bản đầu; chưa có mutation |
| Charter, Stakeholder, Resource & RACI, Risk, Cost, Quality, Change Log | Chưa chuyển | Không triển khai khi chưa có DB Jarvis và contract được phê duyệt |

Các sheet PMBOK vẫn được hiển thị trong thanh sheet để giữ cấu trúc quen thuộc
của Jarvis. Khi chưa có nguồn Jarvis DB, click vào sheet sẽ mở boundary popup
giải thích lý do thay vì giả lập editor hoặc ghi dữ liệu. Đây là boundary rõ
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
- Các giá trị fallback/suy luận được trả kèm `generatedFields` (`startDate`,
  `finishDate`, `progress`, `plan`) để không bị hiểu là dữ liệu kế hoạch gốc
  của TFS.
- Grid `project-tasks` giữ thứ tự cột của Jarvis: STT, mã, tên công việc,
  sản phẩm, người thực hiện, ngày, Actual, Plan, trạng thái, ưu tiên,
  người tạo và thao tác xem. Các thao tác ghi của Jarvis không được bật.
- Task grid giữ header 13 cột ngay cả khi chưa chọn project, trạng thái rỗng
  hiển thị trong một dòng của bảng, có scrollbar ngang riêng và nút cuộn
  trái/phải giống `scroll-btn` của Jarvis. Menu Công cụ mở theo popover, đóng
  khi click ra ngoài hoặc nhấn Escape; Làm mới gọi API đọc TFS, còn các lệnh
  chưa có contract mở boundary popup và không ghi dữ liệu.
- Gantt dùng ngày theo thứ tự `StartDate` và
  `FinishDate → TargetDate → ClosedDate`; khi thiếu thì fallback từ
  `CreatedDate`/`ChangedDate` giống mapper Jarvis. Vùng hiển thị có padding
  `-7/+14 ngày` như Gantt của Jarvis; có header tháng/ngày, weekend,
  today line, zoom và progress fill read-only.
- Tab `Tổng hợp` và chế độ `Resource` của `project-tasks` vẫn chưa có dữ liệu
  tương đương vì phụ thuộc các API/DB Jarvis chưa có trong repository mới;
  click Resource mở boundary popup, không tạo dữ liệu giả.

## Kiểm thử thủ công

1. Dùng Node.js 20.19+; chạy frontend với `VITE_AUTH_MODE=target-dev` và đăng nhập TFS.
2. Mở `/projectmanagement`, xác nhận danh sách collection/project giống kết quả
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
   Quality, Communication và Change Log hiển thị; click vào từng sheet phải mở
   boundary popup, không gọi mutation và không hiển thị dữ liệu giả.
12. Mở `/project-tasks`, chọn project và xác nhận màn hình bắt đầu ở sheet WBS.
13. Trong `/project-tasks`, xác nhận bảng có đủ 13 cột theo thứ tự của Jarvis:
   STT, Mã, Tên công việc, Sản phẩm, Người thực hiện, Bắt đầu, Kết thúc,
   Tiến độ, Plan, Trạng thái, Ưu tiên, Người tạo và Thao tác.
14. Lọc lần lượt theo trạng thái, người thực hiện và độ ưu tiên; xác nhận chỉ
   projection TFS trên bảng thay đổi, không phát sinh request ghi dữ liệu.
15. Xác nhận các card Tổng Task, Hoàn thành, Đang thực hiện, Quá hạn và Tiến độ
   TB khớp với các work item đã tải.
16. Trong Gantt, xác nhận header tháng/ngày, ngày cuối tuần, đường ngày hiện tại,
   nút Today, zoom và phần progress fill hiển thị theo dữ liệu TFS.
17. Chọn lại giá trị rỗng ở bộ chọn dự án; xác nhận bảng, filter, popup và dữ
   liệu chi tiết được reset về trạng thái “Vui lòng chọn dự án”.
18. Mở Công cụ, click ra ngoài hoặc nhấn Escape; xác nhận popover đóng. Mở
   popup work item hoặc boundary popup và xác nhận Escape/backdrop/nút Đóng
   đều đóng được.

19. Chọn biểu tượng Gantt rồi chọn lại biểu tượng Danh sách; xác nhận hai
   trạng thái chuyển đổi hai chiều và chỉ một view được hiển thị. Toggle này
   phải giữ cơ chế radio/label tương đương source để không bị kẹt ở Gantt.
20. Xác nhận các icon Resource, Công cụ và Thêm Task là SVG tương đương
   source; hover/focus không làm thay đổi kích thước hoặc lệch hàng toolbar.
21. Mở Công cụ và xác nhận từng mục có icon, khoảng cách và hover giống
   source; các mục chưa có API vẫn chỉ mở boundary popup, không ghi dữ liệu.

### Summary stats parity

`summary-stats` trong target giữ đúng cấu trúc và nhãn của
`pages/projects/project-tasks.html`: năm card Tổng Task, Hoàn thành, Đang thực
hiện, Quá hạn và Tiến độ TB; icon dùng inline SVG theo source thay cho ký tự
text; màu gradient, kích thước, khoảng cách, border và hiệu ứng hover lấy từ
`pages/projects/project-tasks.css`. Stats chỉ hiển thị sau khi đã chọn project
và tải được work items, giống trạng thái `taskStats` của source.

## Definition of Done của slice UI

- UI compile với TypeScript strict.
- Không sửa `FiinGroup.Jarvis`.
- Có trạng thái loading, empty và error.
- Không dùng dữ liệu mock cho kết quả TFS.
- Chưa chuyển các màn PMBOK ghi dữ liệu khi chưa có quyền DB và yêu cầu
  nghiệp vụ được xác nhận.

## Database comparison gate — 2026-08-14

Read-only verification of the Jarvis development connection confirmed that the
MySQL tunnel is reachable, but the current database snapshot contains no
`pm_project` rows and none of the optional PMBOK tables used by
`/api/pm-flow`. It contains only the currently available Redmine baseline and
an isolated task row. Therefore the target cannot truthfully bind a selected
TFS project to the Jarvis PM flow or enable the source editor save/delete
actions yet. The target keeps those controls at the explicit migration
boundary until an approved project mapping and source data snapshot exist.

## TFS task creation pilot - 2026-08-14

The Task detail popup is now available from both project-management views and
remains read-only. The "Thêm Task" form follows the source task fields that can
be represented by TFS and creates a TFS work item directly through the target
API. It does not write to the inaccessible Jarvis database and does not claim
to replace the source PMBOK task model.

Creation is disabled by default. It requires both Tfs:WriteEnabled=true and
the authenticated user's ADD permission for project-tasks or projectmanagement.
The permission provisioner grants this only when called with --allow-add true;
the default remains ACCESS, VIEW only. Update, delete, progress, baseline,
dependency and PMBOK persistence remain disabled until their source contracts
and data stores are approved.
