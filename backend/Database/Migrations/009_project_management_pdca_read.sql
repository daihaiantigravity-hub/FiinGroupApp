-- Read-only projection of Jarvis pm_project_pdca.

CREATE TABLE IF NOT EXISTS pm_project_pdca (
  id BIGINT NOT NULL AUTO_INCREMENT,
  id_project INT DEFAULT NULL,
  report_date DATE NOT NULL,
  reporter VARCHAR(50) NOT NULL,
  issue_title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  solution TEXT DEFAULT NULL,
  process_status TINYINT NOT NULL DEFAULT 0,
  process_date DATE DEFAULT NULL,
  fault_members TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pm_pdca_project (id_project),
  KEY idx_pm_pdca_date (report_date),
  KEY idx_pm_pdca_status (process_status),
  CONSTRAINT fk_pm_pdca_project FOREIGN KEY (id_project) REFERENCES pm_project(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
