# TFS read-only permission runbook

This operation is for the internal technical pilot only. It changes only the
separate `FiinGroupApp.Identity` database and never changes Jarvis DB or TFS.

The password in `FiinGroup.Jarvis/.env` is not automatically the password for
the separate integration database. Use the `FIINGROUP_DB_PASSWORD` value used
when the MariaDB volume was first created. Changing the Compose environment
after the volume exists does not change the MariaDB user password.

The provisioner creates/reuses role `TFS_READONLY`, grants only `ACCESS` and
`VIEW` for `pm-projects`, `projectmanagement` and `project-tasks`, and maps the
role to an existing active target user. It is idempotent and never creates a
user or grants mutation permissions.

```powershell
cd D:\DEV\FiinGroupApp\backend.PermissionProvisioner
dotnet run -- `
  --connection "Server=127.0.0.1;Port=33306;Database=FiinGroupApp.Identity;User ID=fiingroup_test;Password=<local-secret>" `
  --confirm-database FiinGroupApp.Identity `
  --username "technical.user"
```

After running it, restart the .NET API, log in again so the session receives a
fresh permission snapshot, then test:

1. `/projectmanagement` can load TFS projects.
2. `/project-tasks` can load work items.
3. Teams and Iterations can load for a selected project.
4. No create/edit/delete control is enabled.

## Optional TFS task-creation pilot

Only enable this for the internal technical test. It grants ADD to the
separate TFS_TASK_CREATOR role for the three project forms. It does not grant
EDIT, DELETE, IMPORT, EXPORT or APPROVE.

```powershell
dotnet run -- `
  --connection "Server=127.0.0.1;Port=33306;Database=FiinGroupApp.Identity;User ID=fiingroup_test;Password=<local-secret>" `
  --confirm-database FiinGroupApp.Identity `
  --username "technical.user" `
  --allow-add true
```

The API must also be started with $env:Tfs__WriteEnabled = "true". The
Thêm Task form then sends a direct TFS create request. It does not write to
Jarvis DB. Keep the flag unset or false after testing.

To test the source-like Sửa Task flow separately, provision EDIT explicitly:

```powershell
dotnet run -- `
  --connection "Server=127.0.0.1;Port=33306;Database=FiinGroupApp.Identity;User ID=fiingroup_test;Password=<local-secret>" `
  --confirm-database FiinGroupApp.Identity `
  --username "technical.user" `
  --allow-edit true
```

The update uses the TFS revision returned by the detail endpoint. A stale
revision is rejected by TFS instead of silently overwriting another user's
change. Delete remains disabled.

Verification query:

```sql
SELECT u.username, r.code, p.resource_code, p.action_code
FROM app_users u
JOIN app_user_roles ur ON ur.user_id = u.id
JOIN app_roles r ON r.id = ur.role_id
JOIN app_role_permissions rp ON rp.role_id = r.id
JOIN app_permissions p ON p.id = rp.permission_id
WHERE u.username = 'technical.user'
ORDER BY p.resource_code, p.action_code;
```
