-- FiinGroupApp target-only PMBOK fixture.
-- Synthetic data only. Apply after 003 core, 004 PMBOK migration and the core fixture.
-- Never run against FiinGroup.Jarvis or production.

USE `FiinGroupApp.ProjectManagement`;

START TRANSACTION;

DELETE FROM pm_project_charter WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_project_stakeholder WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_project_resource WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_project_raci WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_project_risk WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_cost_plan WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_quality_plan WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_quality_dod WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_communication_plan WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');
DELETE FROM pm_change_log WHERE pj_id IN (SELECT id FROM pm_project WHERE project_code LIKE 'FIXTURE-PM-%');

INSERT INTO pm_project_charter
  (id, pj_id, business_case, objectives, in_scope, out_scope, deliverables,
   assumptions, constraints_txt, high_risks, sponsor, product_owner,
   approval_status, approved_by, approved_at, created_by)
VALUES
  (79901, 9901, 'Synthetic implementation charter for UI and API validation.',
   'Validate the target PMBOK read model without connecting to Jarvis.',
   'Core project workspace, read-only PMBOK projections and fixture review.',
   'Production migration, TFS mapping and business mutations.',
   'Target API contract, read-only screens and migration verification note.',
   'Fixture is applied to a disposable target database.',
   'No source credentials, production data or TFS write operations.',
   'Synthetic schema/data may diverge until source comparison is approved.',
   'fixture.sponsor', 'fixture.pm', 2, 'fixture.sponsor', '2026-08-10 09:00:00', 'fixture.pm');

INSERT INTO pm_project_stakeholder
  (id, pj_id, stakeholder_type, member, name, role, power, interest,
   expectation, engagement_strategy, owner, created_by)
VALUES
  (80901, 9901, 'INTERNAL', 'fixture.sponsor', 'Synthetic sponsor', 'Sponsor', 'Cao', 'Cao',
   'Có báo cáo tiến độ rõ ràng.', 'Review summary theo tuần.', 'fixture.pm', 'fixture.pm'),
  (80902, 9901, 'INTERNAL', 'fixture.engineer', 'Synthetic engineering', 'Thực hiện', 'TB', 'Cao',
   'Có WBS và acceptance criteria cụ thể.', 'Theo dõi task detail và quality plan.', 'fixture.pm', 'fixture.pm'),
  (80903, 9901, 'EXTERNAL', NULL, 'Synthetic customer', 'Customer representative', 'TB', 'Cao',
   'Nắm được phạm vi và mốc nghiệm thu.', 'Weekly summary read-only.', 'fixture.pm', 'fixture.pm');

INSERT INTO pm_project_resource
  (id, pj_id, member, role, sub_team, effort, unit_rate, planned_mandays, created_by)
VALUES
  (81901, 9901, 'fixture.pm', 'PM', 'Delivery', 0.50, 1.00, 8.00, 'fixture.pm'),
  (81902, 9901, 'fixture.engineer', 'Developer', 'Engineering', 0.75, 1.20, 18.50, 'fixture.pm'),
  (81903, 9901, 'fixture.reviewer', 'QA', 'Quality', 0.35, 1.00, 8.00, 'fixture.pm');

INSERT INTO pm_project_raci (id, pj_id, activity, role, raci_value, sort_order)
VALUES
  (82901, 9901, 'Chốt phạm vi', 'PM', 'A', 1),
  (82902, 9901, 'Chốt phạm vi', 'Sponsor', 'A', 2),
  (82903, 9901, 'Triển khai', 'Developer', 'R', 3),
  (82904, 9901, 'Kiểm thử nghiệm thu', 'QA', 'R', 4),
  (82905, 9901, 'Kiểm thử nghiệm thu', 'PM', 'A', 5);

INSERT INTO pm_project_risk
  (id, pj_id, risk_code, description, category, probability, impact,
   response, owner, trigger_desc, review_date, created_by)
VALUES
  (83901, 9901, 'R-F01', 'Synthetic target schema may not match a future approved source snapshot.', 'Phạm vi', 2, 4,
   'Revalidate against approved source snapshot before production use.', 'fixture.pm', 'Migration contract changes.', '2026-08-28', 'fixture.pm'),
  (83902, 9901, 'R-F02', 'Optional PMBOK migration may not yet be applied to the local database.', 'Triển khai', 3, 3,
   'Keep PmbokEnabled false until migration checksum is verified.', 'fixture.engineer', 'API returns schema unavailable.', '2026-08-21', 'fixture.pm');

INSERT INTO pm_cost_plan
  (id, pj_id, item_name, description, amount, is_contingency, contingency_percent, sort_order, created_by)
VALUES
  (84901, 9901, 'Synthetic engineering effort', 'Fixture-only planning amount.', 22000000, 0, NULL, 1, 'fixture.pm'),
  (84902, 9901, 'Synthetic quality effort', 'Fixture-only verification amount.', 8000000, 0, NULL, 2, 'fixture.pm'),
  (84903, 9901, 'Contingency', 'Fixture-only contingency row.', NULL, 1, 10.00, 3, 'fixture.pm');

INSERT INTO pm_quality_plan
  (id, pj_id, criteria, applies_to, verify_method, acceptance_standard, owner, sort_order, created_by)
VALUES
  (85901, 9901, 'API returns stable typed workspace contract.', 'Project-management API', 'Backend contract tests', 'HTTP success/error envelope remains explicit.', 'fixture.reviewer', 1, 'fixture.pm'),
  (85902, 9901, 'UI shows source boundary and synthetic marker.', 'Local PMBOK screen', 'Frontend build and manual review', 'No screen implies fixture is production data.', 'fixture.reviewer', 2, 'fixture.pm');

INSERT INTO pm_quality_dod (id, pj_id, item_text, sort_order)
VALUES
  (86901, 9901, 'Migration checksum is verified before applying optional PMBOK schema.', 1),
  (86902, 9901, 'Fixture database name is explicitly confirmed as FiinGroupApp.ProjectManagement.', 2),
  (86903, 9901, 'No files in FiinGroup.Jarvis are modified by the target validation.', 3);

INSERT INTO pm_communication_plan
  (id, pj_id, activity, purpose, audience, frequency, channel, owner, sort_order, created_by)
VALUES
  (87901, 9901, 'Weekly PM summary', 'Review synthetic progress and risks.', 'Project team', 'Weekly', 'Target UI', 'fixture.pm', 1, 'fixture.pm'),
  (87902, 9901, 'Migration review', 'Confirm schema, fixture and boundary decisions.', 'Technical owner', 'Per batch', 'AI-DLC audit', 'fixture.pm', 2, 'fixture.pm');

INSERT INTO pm_change_log
  (id, pj_id, cr_code, change_date, change_desc, requested_by, reason,
   impact_scope, impact_time, impact_cost, est_mandays, decision, approver, created_by)
VALUES
  (88901, 9901, 'CR-F01', '2026-08-17', 'Add target-only PMBOK read model.', 'fixture.pm', 'Open source-aligned read-only details for UI validation.',
   'Target PMBOK screens', 'One implementation batch', 'Fixture only', 4.00, 1, 'fixture.sponsor', 'fixture.pm'),
  (88902, 9901, 'CR-F02', '2026-08-17', 'Keep PMBOK writes disabled.', 'fixture.pm', 'No approved source mapping or mutation contract.',
   'No production behavior', 'None', 'None', 0.00, 1, 'fixture.sponsor', 'fixture.pm');

COMMIT;
