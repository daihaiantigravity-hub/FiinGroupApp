-- Explicit mapping between external authentication identities and FiinGroupApp users.
-- No identities or users are seeded by this migration.
CREATE TABLE IF NOT EXISTS app_external_identities (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    subject VARCHAR(320) NOT NULL,
    domain_name VARCHAR(150) NULL,
    unique_name VARCHAR(320) NULL,
    display_name VARCHAR(200) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY ux_app_external_provider_subject (provider, subject),
    KEY ix_app_external_user (user_id),
    CONSTRAINT fk_app_external_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
