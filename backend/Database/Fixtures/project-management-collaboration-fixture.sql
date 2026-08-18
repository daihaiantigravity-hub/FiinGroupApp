-- Target-only synthetic comments, attachments and activity fixture.
-- Apply after 003_project_management_core and 006_project_management_collaboration_read.

DELETE FROM pm_task_activity_log
WHERE id_project IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');

DELETE FROM pm_task_attachment
WHERE task_id IN (SELECT id FROM pm_project_task WHERE id_project IN (
  SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%'
));

DELETE FROM pm_task_comment
WHERE task_id IN (SELECT id FROM pm_project_task WHERE id_project IN (
  SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%'
));

INSERT INTO pm_task_comment
  (id, task_id, user_login, comment, parent_id, created_at)
VALUES
  (89901, 19902, 'fixture.pm', 'Đã chốt phạm vi triển khai cho tuần này.', NULL, '2026-08-12 09:15:00'),
  (89902, 19902, 'fixture.member', 'Đã rõ, tôi sẽ cập nhật kết quả sau khi hoàn tất.', 89901, '2026-08-12 10:00:00'),
  (89903, 19903, 'fixture.pm', 'Cần kiểm tra lại đầu ra trước khi nghiệm thu.', NULL, '2026-08-13 14:30:00');

INSERT INTO pm_task_attachment
  (id, task_id, user_login, file_name, file_path, file_size, file_type, created_at)
VALUES
  (89921, 19902, 'fixture.pm', 'fixture-task-plan.pdf', '/fixtures/project-management/fixture-task-plan.pdf', 24576, 'application/pdf', '2026-08-12 09:20:00');

INSERT INTO pm_task_activity_log
  (id, id_project, task_id, user_login, action_type, field_name, old_value, new_value, description, created_at)
VALUES
  (89931, 9901, 19902, 'fixture.pm', 'progress_update', 'progress', '20', '35', 'Cập nhật tiến độ task', '2026-08-12 09:10:00'),
  (89932, 9901, 19902, 'fixture.pm', 'comment_add', NULL, NULL, NULL, 'Thêm bình luận cho task', '2026-08-12 09:15:00'),
  (89933, 9901, 19903, 'fixture.member', 'attachment_add', NULL, NULL, NULL, 'Đính kèm tài liệu kiểm thử', '2026-08-13 14:35:00');

COMMIT;
