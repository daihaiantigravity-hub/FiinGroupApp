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

Migration `004_project_management_pmbok_core` adds the target-only PMBOK read
model:

- `pm_project_charter`;
- `pm_project_stakeholder`;
- `pm_project_resource` and `pm_project_raci`;
- `pm_project_risk` and `pm_cost_plan`;
- `pm_quality_plan` and `pm_quality_dod`;
- `pm_communication_plan`;
- `pm_change_log`.

It does not import Jarvis data and does not create a TFS-to-project mapping.

Migration `005_project_management_baseline_read` adds the source-aligned
baseline read slice: `pm_task_baseline` and the nullable
`pm_project.active_baseline` marker. It supports baseline list/comparison
reads only; baseline create, activate and delete operations are not enabled.

Migration `006_project_management_collaboration_read` adds target read tables
for comments/replies, attachment metadata and task activity log. It does not
enable comment/attachment/activity writes, file upload or user-directory
mapping.

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

## Optional synthetic fixture

After the migration is verified, a disposable target database may be populated
with the target-aligned synthetic fixture:

```powershell
Get-Content "D:\DEV\FiinGroupApp\backend\Database\Fixtures\project-management-target-fixture.sql" |
  mariadb --host 127.0.0.1 --port <target-port> --user <target-user> --password
```

Confirm that the connection used by `mariadb` names exactly
`FiinGroupApp.ProjectManagement`. The fixture is not executed by the API or
database migrator. It is marked `FIXTURE-PM-*`, has no Jarvis/TFS mapping and
is intended only to validate the target read-only workspace at
`/projectmanagement-local`.

Then, after migration `004`, apply the optional PMBOK fixture:

```powershell
Get-Content "D:\DEV\FiinGroupApp\backend\Database\Fixtures\project-management-pmbok-fixture.sql" |
  mariadb --host 127.0.0.1 --port <target-port> --user <target-user> --password
```

After migration `005`, apply the optional baseline fixture:

```powershell
Get-Content "D:\DEV\FiinGroupApp\backend\Database\Fixtures\project-management-baseline-fixture.sql" |
  mariadb --host 127.0.0.1 --port <target-port> --user <target-user> --password
```

It creates only synthetic baseline rows for `FIXTURE-PM-001`, marks the active
baseline for read display and is safe to repeat on the disposable target
database. The target UI exposes comparison and variance only; it does not
write baseline state.

After migration `006`, apply the optional collaboration fixture:

```powershell
Get-Content "D:\DEV\FiinGroupApp\backend\Database\Fixtures\project-management-collaboration-fixture.sql" |
  mariadb --host 127.0.0.1 --port <target-port> --user <target-user> --password
```

It creates synthetic comments, one reply, one attachment metadata row and
activity entries for `FIXTURE-PM-001`. The target screen displays them as
read-only task detail/project activity data; no file is uploaded or copied.

## Enable the target read-only API

Do not commit the connection string. Set it only in the local process that
starts the API, after the database and fixture have been verified:

```powershell
$env:ProjectManagement__Enabled = "true"
$env:ConnectionStrings__ProjectManagement = "Server=127.0.0.1;Port=<target-port>;Database=FiinGroupApp.ProjectManagement;User ID=<target-user>;Password=<local-secret>"
dotnet run --project backend --launch-profile FiinGroupApp.Api
```

The separate `/projectmanagement-local` screen then calls the read-only
workspace endpoint. The regular `/projectmanagement` and `/project-tasks`
screens continue to use their approved TFS projection and do not infer a
mapping from the synthetic fixture.

Set the optional PMBOK flag only after migration `004` and its fixture have
been verified:

```powershell
$env:ProjectManagement__PmbokEnabled = "true"
```

If the flag is enabled before migration `004`, the API returns the explicit
`PROJECT_MANAGEMENT_PMBOK_SCHEMA_UNAVAILABLE` error instead of silently
falling back to fabricated data.
