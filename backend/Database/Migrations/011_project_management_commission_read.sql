-- Read-only projection of Jarvis pm_project_commission.

CREATE TABLE IF NOT EXISTS pm_project_commission (
  id BIGINT NOT NULL AUTO_INCREMENT,
  project_id INT NOT NULL,
  payment_id BIGINT NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(18,0) NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 0,
  remarks TEXT DEFAULT NULL,
  expected_date DATE DEFAULT NULL,
  recipient_info TEXT DEFAULT NULL,
  actual_date DATE DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pm_commission_project (project_id),
  KEY idx_pm_commission_payment (payment_id),
  CONSTRAINT fk_pm_commission_project FOREIGN KEY (project_id) REFERENCES pm_project(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_commission_payment FOREIGN KEY (payment_id) REFERENCES pm_project_payment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
