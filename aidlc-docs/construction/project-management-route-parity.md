# Project Management Route Parity Matrix

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

## Acceptance evidence required

Mỗi sheet chỉ được mở khi có:

- source response mẫu đã loại bỏ dữ liệu nhạy cảm;
- bảng/column query mapping;
- permission matrix;
- target DTO/API contract;
- UI comparison với source;
- test empty/forbidden/error và mutation rollback nếu có ghi.
