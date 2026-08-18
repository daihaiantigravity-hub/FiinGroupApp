-- FiinGroupApp target-only project-management fixture.
-- Synthetic data only. Apply manually after 003_project_management_core.sql.
-- Never run this file against FiinGroup.Jarvis or a production database.

USE `FiinGroupApp.ProjectManagement`;

START TRANSACTION;

-- The marker makes this fixture repeatable on a disposable target database.
-- It removes only rows previously created by this fixture.
DELETE c
FROM pm_project_commission c
INNER JOIN pm_project project ON project.id = c.project_id
WHERE project.project_code LIKE 'FIXTURE-PM-%';

DELETE r
FROM pm_project_request r
INNER JOIN pm_project project ON project.id = r.project_id
WHERE project.project_code LIKE 'FIXTURE-PM-%';

DELETE x
FROM pm_project_pdca x
INNER JOIN pm_project project ON project.id = x.id_project
WHERE project.project_code LIKE 'FIXTURE-PM-%';

DELETE c
FROM pm_project_cost_other c
INNER JOIN pm_project project ON project.id = c.id_project
WHERE project.project_code LIKE 'FIXTURE-PM-%';

DELETE d
FROM pm_project_payment_doc d
INNER JOIN pm_project_payment p ON p.id = d.payment_id
INNER JOIN pm_project project ON project.id = p.pj_id
WHERE project.project_code LIKE 'FIXTURE-PM-%';

DELETE p
FROM pm_project_payment p
INNER JOIN pm_project project ON project.id = p.pj_id
WHERE project.project_code LIKE 'FIXTURE-PM-%';

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
   sign_date, acceptance_date, warranty_months, warranty_end_date,
   maintenance_percent, next_action_date, status, is_tracking, remarks,
   comm_percent, comm_amount)
VALUES
  (9901, 99001, 'fixture.pm', 'SYNTHETIC CUSTOMER A', 'FIXTURE-PM-001', 'FIX-001',
   'Target fixture implementation', 1, 100000000, 20.00, 20000000,
   '2026-08-01', '2026-09-15', '2026-07-25', NULL, 3, '2026-09-18',
   5.00, '2026-08-29', 1, 1, 'Synthetic target-only fixture', 2.00, 2000000),
  (9902, 99002, 'fixture.pm', 'SYNTHETIC CUSTOMER B', 'FIXTURE-PM-002', NULL,
   'Target fixture maintenance', 2, 50000000, 10.00, 5000000,
   '2026-08-05', '2026-08-25', '2026-08-01', '2026-08-25', 12, '2027-08-25',
   8.00, '2026-09-01', 0, 1, 'Synthetic target-only fixture', 1.50, 750000);

INSERT INTO pm_project_payment
  (id, pj_id, payment_no, process_date, invoice_date, payment_percent,
   payment_amount, status, actual_payment_date, remarks)
VALUES
  (79901, 9901, 1, '2026-08-10', '2026-08-12', 30.00, 30000000, 3, '2026-08-15', 'Synthetic initial payment'),
  (79902, 9901, 2, '2026-08-28', NULL, 40.00, 40000000, 1, NULL, 'Synthetic milestone payment'),
  (79903, 9902, 1, '2026-08-18', NULL, 50.00, 25000000, 0, NULL, 'Synthetic maintenance payment');

INSERT INTO pm_project_commission
  (id, project_id, payment_id, commission_percent, commission_amount, status,
   remarks, expected_date, recipient_info, actual_date)
VALUES
  (84901, 9901, 79901, 2.00, 600000, 3, 'Synthetic paid commission', '2026-08-20', 'Synthetic recipient', '2026-08-20'),
  (84902, 9901, 79902, 2.00, 800000, 0, 'Synthetic pending commission', '2026-09-05', 'Synthetic recipient', NULL),
  (84903, 9902, 79903, 1.50, 375000, 0, 'Synthetic pending commission', '2026-09-10', 'Synthetic recipient', NULL);

INSERT INTO pm_project_payment_doc
  (id, payment_id, doc_name, doc_status, attachment, remarks)
VALUES
  (80901, 79901, 'Biên bản nghiệm thu', 3, NULL, 'Synthetic document'),
  (80902, 79902, 'Hóa đơn VAT', 1, NULL, 'Synthetic document');

INSERT INTO pm_project_cost_other
  (id, id_project, cost_type, phase, amount, executor_notes, product_type, status, remarks)
VALUES
  (81901, 9901, 'cloud', 'Execution', 1800000, 'Synthetic cloud environment', 'be', 2, 'Synthetic target-only cost'),
  (81902, 9901, 'license', 'Validation', 2500000, 'Synthetic test license', 'qc', 1, 'Synthetic target-only cost'),
  (81903, 9902, 'device', 'Maintenance', 1200000, 'Synthetic replacement device', 'all', 0, 'Synthetic target-only cost');

INSERT INTO pm_project_pdca
  (id, id_project, report_date, reporter, issue_title, description, solution,
   process_status, process_date, fault_members, notes)
VALUES
  (82901, 9901, '2026-08-14', 'fixture.pm', 'Thiếu dữ liệu nghiệm thu',
   'Synthetic issue discovered during implementation review.',
   'Bổ sung checklist và phân công reviewer.', 2, '2026-08-15', 'fixture.engineer', 'Synthetic PDCA record'),
  (82902, 9902, '2026-08-18', 'fixture.pm', 'Thiết bị bảo trì chưa sẵn sàng',
   'Synthetic maintenance risk.', NULL, 0, NULL, NULL, 'Synthetic PDCA record');

INSERT INTO pm_project_request
  (id, project_id, request_date, member, manager, request_type, title, content,
   amount, reference, processed_date, status, approver, notes)
VALUES
  (83901, 9901, '2026-08-12', 'fixture.engineer', 'fixture.pm', 'resource',
   'Bổ sung reviewer nghiệm thu', 'Đề xuất thêm một reviewer cho giai đoạn validation.',
   NULL, NULL, '2026-08-13', 3, 'fixture.pm', 'Synthetic request completed'),
  (83902, 9902, '2026-08-19', 'fixture.pm', NULL, 'cost',
   'Đề xuất mua thiết bị thay thế', 'Cần phê duyệt chi phí thiết bị phục vụ bảo trì.',
   1200000, NULL, NULL, 0, NULL, 'Synthetic request pending');

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
   'LOCAL-FIXTURE', 'LOCAL', '99001', 'fixture-19901', 1, NULL),
  (19902, 9901, NULL, 'FIX-002', 'Triển khai bản đầu', 'Synthetic implementation task',
   'Implementation build', '2026-08-06', '2026-08-28', '2026-08-06', NULL, 23,
   55.00, 70.00, 3, 1, 1, 2, 18.50, 1, 'Execution', 'Engineering', 'fixture.pm',
   'LOCAL-FIXTURE', 'LOCAL', '99001', 'fixture-19902', 2, NULL),
  (19903, 9901, 19902, 'FIX-002.1', 'Kiểm thử nghiệm thu', 'Synthetic child verification task',
   'Verification report', '2026-08-29', '2026-09-05', NULL, NULL, 8,
   0.00, 30.00, 2, 1, 0, 3, 8.00, 0, 'Validation', 'QA', 'fixture.pm',
   'LOCAL-FIXTURE', 'LOCAL', '99001', 'fixture-19903', 1, NULL),
  (19904, 9902, NULL, 'FIX-001', 'Rà soát bảo trì', 'Synthetic maintenance review',
   'Review note', '2026-08-05', '2026-08-07', '2026-08-05', NULL, 3,
   20.00, 50.00, 1, 1, 0, 1, 2.00, 0, 'Maintenance', 'Support', 'fixture.pm',
   'LOCAL-FIXTURE', 'LOCAL', '99002', 'fixture-19904', 1, NULL);

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
   'fixture.engineer', 'fixture.pm', 1),
  (69904, 'fixture.pm', 2026, 'SYNTHETIC CUSTOMER B', 9902, 'Target fixture maintenance',
   80.00, 0.00, 35, 2, 0, '2026-08-24', '2026-08-28', 'Synthetic next-week summary plan',
   'fixture.engineer', 'fixture.pm', 1);

COMMIT;
