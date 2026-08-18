-- Read-only projection of Jarvis pm_project_payment and payment documents.
-- This migration creates target tables only; no source data is copied.

CREATE TABLE IF NOT EXISTS pm_project_payment (
  id BIGINT NOT NULL AUTO_INCREMENT,
  pj_id BIGINT NOT NULL,
  payment_no INT NOT NULL,
  process_date DATE DEFAULT NULL,
  invoice_date DATE DEFAULT NULL,
  payment_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  payment_amount DECIMAL(18,0) NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 0,
  actual_payment_date DATE DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pm_payment_no (pj_id, payment_no),
  KEY idx_pm_payment_project (pj_id),
  CONSTRAINT fk_pm_payment_project FOREIGN KEY (pj_id) REFERENCES pm_project(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pm_project_payment_doc (
  id BIGINT NOT NULL AUTO_INCREMENT,
  payment_id BIGINT NOT NULL,
  doc_name VARCHAR(255) NOT NULL,
  doc_status TINYINT NOT NULL DEFAULT 0,
  attachment TEXT DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pm_payment_doc_payment (payment_id),
  CONSTRAINT fk_pm_payment_doc_payment FOREIGN KEY (payment_id) REFERENCES pm_project_payment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
