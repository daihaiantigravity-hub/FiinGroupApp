-- FiinGroupApp target-only read model for the Jarvis task baseline surface.
-- No source rows, TFS mapping or mutation endpoint is created by this migration.

ALTER TABLE pm_project
  ADD COLUMN IF NOT EXISTS active_baseline VARCHAR(100) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS pm_task_baseline (
  id INT NOT NULL AUTO_INCREMENT,
  baseline_name VARCHAR(100) NOT NULL,
  id_project INT NOT NULL,
  task_id INT NOT NULL,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  planned_duration INT DEFAULT NULL,
  planned_effort DECIMAL(10,2) DEFAULT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_baseline_project (id_project),
  KEY idx_baseline_task (task_id),
  KEY idx_baseline_name (baseline_name),
  CONSTRAINT fk_target_baseline_task FOREIGN KEY (task_id) REFERENCES pm_project_task(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
