# Project-management database migration runbook

## Scope

Migration `003_project_management_core` creates the target business schema
derived from the trusted Jarvis PM schema. It contains no seed rows and is
separate from `FiinGroupApp.Identity`.

The migration currently covers:

- `pm_project`;
- `pm_project_task`;
- `pm_task_assignee`;
- `pm_task_dependency`;
- `pm_task_log`;
- `pm_task_plan`;
- `pm_project_summary`.

It does not import Jarvis data and does not create a TFS-to-project mapping.

## Preconditions

1. Use a disposable/local MariaDB database first.
2. Confirm the connection database is exactly `FiinGroupApp.ProjectManagement`.
3. Do not point this command at Jarvis or production.
4. Review the SQL and approve the migration checksum in the manifest.

## Apply manually

From `D:\DEV\FiinGroupApp`:

```powershell
dotnet run --project backend.DatabaseMigrator -- `
  --connection "<target project-management connection string>" `
  --confirm-database FiinGroupApp.ProjectManagement `
  --manifest "D:\DEV\FiinGroupApp\backend\Database\ProjectManagementMigrations\migrations.json"
```

The API does not execute this migration at startup. The migrator records
checksums in `app_schema_migrations` and refuses a database or manifest mismatch.

## Verification

```sql
SHOW TABLES;
SELECT COUNT(*) FROM pm_project;
SELECT COUNT(*) FROM pm_project_task;
```

Expected initial row counts are zero. Do not run the Jarvis restore file or copy
source business records into this database.
