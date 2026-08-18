-- Read-only projection of Jarvis pm_project_cost_other.

CREATE TABLE IF NOT EXISTS pm_project_cost_other (
  id BIGINT NOT NULL AUTO_INCREMENT,
  id_project INT NOT NULL,
  cost_type VARCHAR(50) NOT NULL,
  phase VARCHAR(100) NOT NULL,
  amount DECIMAL(18,0) NOT NULL,
  executor_notes TEXT DEFAULT NULL,
  product_type VARCHAR(20) DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 0,
  remarks TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pm_cost_other_project (id_project),
  KEY idx_pm_cost_other_status (status),
  CONSTRAINT fk_pm_cost_other_project FOREIGN KEY (id_project) REFERENCES pm_project(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
