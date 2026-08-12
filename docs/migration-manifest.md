# Migration Manifest

The identity database migration is intentionally tracked outside application startup. The manifest is the review list for migrations that may be applied to the dedicated FiinGroupApp database.

## Required checks before applying

- Confirm the target database is not the Jarvis database.
- Generate and replace the `PENDING_CHECKSUM_GENERATION` value in `backend/Database/Migrations/migrations.json` with the SHA-256 of the exact SQL file.
- Review the migration as non-destructive and approved.
- Run it against a disposable MySQL/MariaDB database first.
- Verify schema, foreign keys, indexes and zero seeded users.
- Record execution metadata outside the source repository.

## Startup policy

The API does not execute migrations during startup. A deployment/operator process must apply reviewed migrations explicitly.
