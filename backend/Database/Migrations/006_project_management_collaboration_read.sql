-- Target-only read model for the trusted Jarvis task collaboration tables.
-- No comment, attachment or activity mutation is exposed by the target API.

CREATE TABLE IF NOT EXISTS pm_task_comment (
  id INT NOT NULL AUTO_INCREMENT,
  task_id INT NOT NULL,
  user_login VARCHAR(50) NOT NULL,
  comment TEXT NOT NULL,
  parent_id INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_target_comment_task (task_id),
  KEY idx_target_comment_user (user_login),
  KEY idx_target_comment_parent (parent_id),
  KEY idx_target_comment_created (created_at),
  CONSTRAINT fk_target_comment_task FOREIGN KEY (task_id) REFERENCES pm_project_task(id) ON DELETE CASCADE,
  CONSTRAINT fk_target_comment_parent FOREIGN KEY (parent_id) REFERENCES pm_task_comment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pm_task_attachment (
  id INT NOT NULL AUTO_INCREMENT,
  task_id INT NOT NULL,
  user_login VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT DEFAULT NULL,
  file_type VARCHAR(100) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_target_attachment_task (task_id),
  KEY idx_target_attachment_user (user_login),
  CONSTRAINT fk_target_attachment_task FOREIGN KEY (task_id) REFERENCES pm_project_task(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pm_task_activity_log (
  id INT NOT NULL AUTO_INCREMENT,
  id_project INT NOT NULL,
  task_id INT DEFAULT NULL,
  user_login VARCHAR(50) NOT NULL,
  action_type ENUM(
    'create', 'update', 'delete',
    'status_change', 'progress_update',
    'assignee_add', 'assignee_remove',
    'dependency_add', 'dependency_remove',
    'comment_add', 'attachment_add',
    'baseline_create'
  ) NOT NULL,
  field_name VARCHAR(100) DEFAULT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT DEFAULT NULL,
  description VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_target_activity_project (id_project),
  KEY idx_target_activity_task (task_id),
  KEY idx_target_activity_user (user_login),
  KEY idx_target_activity_action (action_type),
  KEY idx_target_activity_created (created_at),
  CONSTRAINT fk_target_activity_task FOREIGN KEY (task_id) REFERENCES pm_project_task(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
