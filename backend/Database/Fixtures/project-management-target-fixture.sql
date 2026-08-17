-- FiinGroupApp target-only project-management fixture.
-- Synthetic data only. Apply manually after 003_project_management_core.sql.
-- Never run this file against FiinGroup.Jarvis or a production database.

USE `FiinGroupApp.ProjectManagement`;

START TRANSACTION;

-- The marker makes this fixture repeatable on a disposable target database.
-- It removes only rows previously created by this fixture.
DELETE d
FROM pm_task_dependency d
INNER JOIN pm_project_task t ON t.id = d.task_id
INNER JOIN pm_project p ON p.id = t.id_project
WHERE p.project_code LIKE 'FIXTURE-PM-%';

DELETE l
FROM pm_task_log l
INNER JOIN pm_project_task t ON t.id = l.task_id
INNER JOIN pm_project p ON p.id = t.id_project
WHERE p.project_code LIKE 'FIXTURE-PM-%';

DELETE a
FROM pm_task_assignee a
INNER JOIN pm_project_task t ON t.id = a.task_id
INNER JOIN pm_project p ON p.id = t.id_project
WHERE p.project_code LIKE 'FIXTURE-PM-%';

DELETE FROM pm_task_plan
WHERE id_project IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');

DELETE FROM pm_project_summary
WHERE id_project IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');

DELETE t
FROM pm_project_task t
INNER JOIN pm_project p ON p.id = t.id_project
WHERE p.project_code LIKE 'FIXTURE-PM-%';

DELETE FROM pm_project
WHERE project_code LIKE 'FIXTURE-PM-%';

INSERT INTO pm_project
  (id, id_project, pm, customer, project_code, annex_no, annex_name,
   contract_type, amount, percent_budget, budget, start_date, end_date,
   status, is_tracking, remarks)
VALUES
  (9901, 99001, 'fixture.pm', 'SYNTHETIC CUSTOMER A', 'FIXTURE-PM-001', 'FIX-001',
   'Target fixture implementation', 1, 100000000, 20.00, 20000000,
   '2026-08-01', '2026-09-15', 1, 1, 'Synthetic target-only fixture'),
  (9902, 99002, 'fixture.pm', 'SYNTHETIC CUSTOMER B', 'FIXTURE-PM-002', NULL,
   'Target fixture maintenance', 2, 50000000, 10.00, 5000000,
   '2026-08-05', '2026-08-25', 0, 1, 'Synthetic target-only fixture');

INSERT INTO pm_project_task
  (id, id_project, parent_id, task_code, task_name, description, product,
   start_date, end_date, actual_start, actual_end, duration, progress, plan,
   priority, task_type, status, sort_order, effort, is_critical, phase,
   dept_role, created_by, source_system, source_collection, source_project_id,
   source_id, source_revision, source_url)
VALUES
  (19901, 9901, NULL, 'FIX-001', 'Khởi động và khảo sát', 'Synthetic discovery task',
   'Discovery brief', '2026-08-01', '2026-08-05', '2026-08-01', '2026-08-05', 5,
   100.00, 100.00, 2, 1, 3, 1, 5.00, 0, 'Initiation', 'PM / BA', 'fixture.pm',
   'LOCAL-FIXTURE', '99001', 'fixture-19901', 1, NULL),
  (19902, 9901, NULL, 'FIX-002', 'Triển khai bản đầu', 'Synthetic implementation task',
   'Implementation build', '2026-08-06', '2026-08-28', '2026-08-06', NULL, 23,
   55.00, 70.00, 3, 1, 1, 2, 18.50, 1, 'Execution', 'Engineering', 'fixture.pm',
   'LOCAL-FIXTURE', '99001', 'fixture-19902', 2, NULL),
  (19903, 9901, 19902, 'FIX-002.1', 'Kiểm thử nghiệm thu', 'Synthetic child verification task',
   'Verification report', '2026-08-29', '2026-09-05', NULL, NULL, 8,
   0.00, 30.00, 2, 1, 0, 3, 8.00, 0, 'Validation', 'QA', 'fixture.pm',
   'LOCAL-FIXTURE', '99001', 'fixture-19903', 1, NULL),
  (19904, 9902, NULL, 'FIX-001', 'Rà soát bảo trì', 'Synthetic maintenance review',
   'Review note', '2026-08-05', '2026-08-07', '2026-08-05', NULL, 3,
   20.00, 50.00, 1, 1, 0, 1, 2.00, 0, 'Maintenance', 'Support', 'fixture.pm',
   'LOCAL-FIXTURE', '99002', 'fixture-19904', 1, NULL);

INSERT INTO pm_task_assignee (id, task_id, assignee, role)
VALUES
  (29901, 19901, 'fixture.pm', 1),
  (29902, 19902, 'fixture.engineer', 1),
  (29903, 19902, 'fixture.reviewer', 2),
  (29904, 19903, 'fixture.reviewer', 2),
  (29905, 19904, 'fixture.engineer', 1);

INSERT INTO pm_task_dependency (id, task_id, depends_on_id, dependency_type, lag_days)
VALUES
  (39901, 19902, 19901, 1, 0),
  (39902, 19903, 19902, 1, 1);

INSERT INTO pm_task_log (id, task_id, updated_by, field_name, old_value, new_value, note, created_at)
VALUES
  (49901, 19902, 'fixture.pm', 'progress', '30', '55', 'Synthetic progress review', '2026-08-15 09:00:00'),
  (49902, 19902, 'fixture.engineer', 'status', '0', '1', 'Synthetic implementation started', '2026-08-06 10:30:00'),
  (49903, 19901, 'fixture.pm', 'progress', '80', '100', 'Synthetic discovery completed', '2026-08-05 16:00:00');

INSERT INTO pm_task_plan
  (id, year, month, week, section_type, entry_type, customer, id_project,
   task_desc, from_date, to_date, current_progress, plan_progress,
   result_progress, result_notes, resource, remarks, sort_order, created_by, status)
VALUES
  (59901, 2026, 8, 33, 2, 0, 'SYNTHETIC CUSTOMER A', 9901,
   'Hoàn tất khảo sát và chốt phạm vi', '2026-08-10', '2026-08-14', 100.00, 100.00,
   100.00, 'Synthetic weekly result', 'fixture.pm, fixture.engineer', 'Fixture week 33', 1, 'fixture.pm', 1),
  (59902, 2026, 8, 34, 2, 0, 'SYNTHETIC CUSTOMER A', 9901,
   'Tiếp tục triển khai bản đầu và chuẩn bị kiểm thử', '2026-08-17', '2026-08-21', 55.00, 70.00,
   NULL, NULL, 'fixture.engineer, fixture.reviewer', 'Fixture week 34', 1, 'fixture.pm', 1),
  (59903, 2026, 8, 34, 2, 0, 'SYNTHETIC CUSTOMER B', 9902,
   'Rà soát lịch bảo trì', '2026-08-17', '2026-08-19', 20.00, 50.00,
   NULL, NULL, 'fixture.engineer', 'Fixture week 34', 1, 'fixture.pm', 1);

INSERT INTO pm_project_summary
  (id, pm, year, customer, id_project, annex_name, plan_percent,
   actual_percent, week, section_type, entry_type, start_date, end_date,
   notes, resources, updated_by, status)
VALUES
  (69901, 'fixture.pm', 2026, 'SYNTHETIC CUSTOMER A', 9901, 'Target fixture implementation',
   100.00, 100.00, 33, 1, 1, '2026-08-10', '2026-08-14', 'Synthetic completed week',
   'fixture.pm', 'fixture.pm', 1),
  (69902, 'fixture.pm', 2026, 'SYNTHETIC CUSTOMER A', 9901, 'Target fixture implementation',
   70.00, 55.00, 34, 1, 1, '2026-08-17', '2026-08-21', 'Synthetic current week',
   'fixture.engineer, fixture.reviewer', 'fixture.pm', 1),
  (69903, 'fixture.pm', 2026, 'SYNTHETIC CUSTOMER B', 9902, 'Target fixture maintenance',
   50.00, 20.00, 34, 1, 1, '2026-08-17', '2026-08-19', 'Synthetic current week',
   'fixture.engineer', 'fixture.pm', 1);

COMMIT;
