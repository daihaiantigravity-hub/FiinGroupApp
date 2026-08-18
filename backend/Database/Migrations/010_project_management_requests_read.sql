-- Read-only projection of Jarvis pm_project_requests.

CREATE TABLE IF NOT EXISTS pm_project_request (
  id BIGINT NOT NULL AUTO_INCREMENT,
  project_id INT DEFAULT NULL,
  request_date DATE NOT NULL,
  member VARCHAR(50) NOT NULL,
  manager VARCHAR(50) DEFAULT NULL,
  request_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  amount DECIMAL(15,0) DEFAULT NULL,
  reference TEXT DEFAULT NULL,
  processed_date DATE DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 0,
  approver VARCHAR(50) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pm_request_project (project_id),
  KEY idx_pm_request_date (request_date),
  KEY idx_pm_request_status (status),
  CONSTRAINT fk_pm_request_project FOREIGN KEY (project_id) REFERENCES pm_project(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
