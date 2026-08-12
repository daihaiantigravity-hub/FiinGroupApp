# Database Migration Runbook

1. Create a dedicated empty database for FiinGroupApp.
2. Configure credentials through deployment secrets, never source files.
3. Run `backend/Database/Migrations/001_identity.sql` against that database only.
4. Verify tables, foreign keys and unique indexes.
5. Confirm no rows were seeded in `app_users`.
6. Record database name, migration checksum and execution timestamp.
7. Do not point the application at the database until the .NET store and tests are complete.

8. Update and verify `backend/Database/Migrations/migrations.json` before applying any migration.

Rollback in a disposable environment means dropping the new database. Production rollback requires an approved backup/restore procedure; never drop a shared or legacy database.
