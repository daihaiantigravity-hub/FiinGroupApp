-- Separate FiinGroupApp identity store. No credentials or seed users.
CREATE TABLE IF NOT EXISTS app_users (
    id CHAR(36) NOT NULL,
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NULL,
    password_hash VARCHAR(500) NULL,
    status ENUM('ACTIVE', 'DISABLED', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until DATETIME(6) NULL,
    last_login_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id), UNIQUE KEY ux_app_users_username (username), UNIQUE KEY ux_app_users_email (email), KEY ix_app_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_roles (
    id CHAR(36) NOT NULL, code VARCHAR(100) NOT NULL, name VARCHAR(200) NOT NULL,
    status ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE', created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id), UNIQUE KEY ux_app_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_permissions (
    id CHAR(36) NOT NULL, resource_code VARCHAR(150) NOT NULL, action_code VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (id),
    UNIQUE KEY ux_app_permissions_resource_action (resource_code, action_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_user_roles (
    user_id CHAR(36) NOT NULL, role_id CHAR(36) NOT NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_app_user_roles_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_user_roles_role FOREIGN KEY (role_id) REFERENCES app_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_role_permissions (
    role_id CHAR(36) NOT NULL, permission_id CHAR(36) NOT NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_app_role_permissions_role FOREIGN KEY (role_id) REFERENCES app_roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES app_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_sessions (
    id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL, refresh_token_hash CHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL, revoked_at DATETIME(6) NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_seen_at DATETIME(6) NULL, ip_address VARCHAR(45) NULL, user_agent VARCHAR(500) NULL,
    PRIMARY KEY (id), UNIQUE KEY ux_app_sessions_refresh_hash (refresh_token_hash), KEY ix_app_sessions_user_expiry (user_id, expires_at),
    CONSTRAINT fk_app_sessions_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_two_factor_methods (
    id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL, method ENUM('TOTP', 'EMAIL_OTP') NOT NULL,
    secret_ciphertext VARBINARY(1024) NULL, enabled_at DATETIME(6) NULL, disabled_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (id), UNIQUE KEY ux_app_2fa_user_method (user_id, method),
    CONSTRAINT fk_app_2fa_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_auth_challenges (
    id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL, method ENUM('TOTP', 'EMAIL_OTP') NOT NULL,
    code_hash CHAR(64) NULL, expires_at DATETIME(6) NOT NULL, attempts INT NOT NULL DEFAULT 0, consumed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (id), KEY ix_app_challenges_expiry (expires_at),
    CONSTRAINT fk_app_challenges_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
