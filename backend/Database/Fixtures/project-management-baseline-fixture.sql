-- Target-only synthetic baseline fixture.
-- Apply after 003_project_management_core and 005_project_management_baseline_read
-- on a disposable target database.

DELETE FROM pm_task_baseline
WHERE id_project IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');

UPDATE pm_project
SET active_baseline = NULL
WHERE project_code LIKE 'FIXTURE-PM-%';

INSERT INTO pm_task_baseline
  (id, baseline_name, id_project, task_id, planned_start_date, planned_end_date,
   planned_duration, planned_effort, created_by, created_at)
VALUES
  (79901, 'Baseline 2026-08-01', 9901, 19901, '2026-08-01', '2026-08-05', 5, 5.00, 'fixture.pm', '2026-08-01 09:00:00'),
  (79902, 'Baseline 2026-08-01', 9901, 19902, '2026-08-06', '2026-08-25', 20, 16.00, 'fixture.pm', '2026-08-01 09:00:00'),
  (79903, 'Baseline 2026-08-01', 9901, 19903, '2026-08-26', '2026-09-01', 7, 7.00, 'fixture.pm', '2026-08-01 09:00:00');

UPDATE pm_project
SET active_baseline = 'Baseline 2026-08-01'
WHERE id = 9901 AND project_code = 'FIXTURE-PM-001';

COMMIT;
