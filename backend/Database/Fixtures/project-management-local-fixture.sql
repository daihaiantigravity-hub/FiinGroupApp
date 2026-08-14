-- FiinGroupApp local-only project-management fixture.
-- Synthetic data only; do not run against Jarvis or production.
-- Schema/field names are aligned with the trusted Jarvis migrations.

CREATE DATABASE IF NOT EXISTS `FiinGroupApp.ProjectManagementFixture`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `FiinGroupApp.ProjectManagementFixture`;

CREATE TABLE IF NOT EXISTS `pm_project` (
  `id_project` INT NOT NULL,
  `pm` VARCHAR(50) NOT NULL,
  `customer` VARCHAR(255) NOT NULL,
  `project_code` VARCHAR(100) NOT NULL,
  `annex_no` VARCHAR(100) DEFAULT NULL,
  `annex_name` VARCHAR(255) DEFAULT NULL,
  `contract_type` TINYINT NOT NULL DEFAULT 1,
  `amount` DECIMAL(18,0) DEFAULT 0,
  `percent_budget` DECIMAL(5,2) DEFAULT 0,
  `budget` DECIMAL(18,0) DEFAULT 0,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 0,
  `sign_date` DATE DEFAULT NULL,
  `acceptance_date` DATE DEFAULT NULL,
  `warranty_months` INT DEFAULT NULL,
  `warranty_end_date` DATE DEFAULT NULL,
  `maintenance_percent` DECIMAL(5,2) DEFAULT NULL,
  `next_action_date` DATE DEFAULT NULL,
  `is_tracking` TINYINT NOT NULL DEFAULT 1,
  `remarks` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pm_project_task` (
  `id` INT AUTO_INCREMENT,
  `id_project` INT NOT NULL,
  `parent_id` INT DEFAULT NULL,
  `task_code` VARCHAR(50) NOT NULL,
  `task_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `product` VARCHAR(500),
  `start_date` DATE,
  `end_date` DATE,
  `actual_start` DATE,
  `actual_end` DATE,
  `duration` INT DEFAULT 0,
  `progress` DECIMAL(5,2) DEFAULT 0.00,
  `priority` TINYINT DEFAULT 2,
  `task_type` TINYINT DEFAULT 1,
  `status` TINYINT DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  `created_by` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`id_project`),
  KEY `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pm_task_assignee` (
  `id` INT AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `assignee` VARCHAR(50) NOT NULL,
  `role` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_assignee` (`task_id`, `assignee`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pm_task_dependency` (
  `id` INT AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `depends_on_id` INT NOT NULL,
  `dependency_type` TINYINT DEFAULT 1,
  `lag_days` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dependency` (`task_id`, `depends_on_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `pm_project`
  (`id_project`, `pm`, `customer`, `project_code`, `annex_no`, `annex_name`,
   `contract_type`, `amount`, `percent_budget`, `budget`, `start_date`, `end_date`,
   `status`, `is_tracking`, `remarks`)
VALUES
  (9001, 'fixture.pm', 'LOCAL CUSTOMER A', 'LOCAL-PM-001', 'LOCAL-001',
   'Local project fixture', 1, 100000000, 0.20, 20000000,
   '2026-08-01', '2026-08-31', 1, 1, 'Synthetic fixture only'),
  (9002, 'fixture.pm', 'LOCAL CUSTOMER B', 'LOCAL-PM-002', NULL,
   'Local maintenance fixture', 2, 50000000, 0.10, 5000000,
   '2026-08-05', '2026-08-25', 0, 1, 'Synthetic fixture only');

INSERT INTO `pm_project_task`
  (`id`, `id_project`, `parent_id`, `task_code`, `task_name`, `description`,
   `product`, `start_date`, `end_date`, `duration`, `progress`, `priority`,
   `task_type`, `status`, `sort_order`, `created_by`)
VALUES
  (19001, 9001, NULL, 'T001', 'Local discovery', 'Synthetic discovery task',
   'Discovery note', '2026-08-01', '2026-08-03', 3, 100.00, 2, 1, 3, 1, 'fixture.pm'),
  (19002, 9001, NULL, 'T002', 'Local implementation', 'Synthetic implementation task',
   'Implementation build', '2026-08-04', '2026-08-15', 12, 40.00, 3, 1, 1, 2, 'fixture.pm'),
  (19003, 9001, 19002, 'T002.1', 'Local verification', 'Synthetic child task',
   'Verification report', '2026-08-16', '2026-08-20', 5, 0.00, 2, 1, 0, 3, 'fixture.pm'),
  (19004, 9002, NULL, 'T001', 'Local maintenance review', 'Synthetic maintenance task',
   'Review note', '2026-08-05', '2026-08-07', 3, 0.00, 1, 1, 0, 1, 'fixture.pm');

INSERT INTO `pm_task_assignee` (`task_id`, `assignee`, `role`)
VALUES (19001, 'fixture.engineer', 1), (19002, 'fixture.engineer', 1),
       (19003, 'fixture.reviewer', 2), (19004, 'fixture.engineer', 1);

INSERT INTO `pm_task_dependency` (`task_id`, `depends_on_id`, `dependency_type`, `lag_days`)
VALUES (19002, 19001, 1, 0), (19003, 19002, 1, 0);
