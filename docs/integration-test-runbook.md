# Disposable Identity Integration Test Runbook

This environment is only for local/disposable testing. It is not the Jarvis database and must not be used as a production deployment definition.

## Start database

```powershell
$env:FIINGROUP_DB_USER = "fiingroup_test"
$env:FIINGROUP_DB_PASSWORD = "use-a-local-only-password"
$env:FIINGROUP_DB_ROOT_PASSWORD = "use-a-local-only-root-password"
$env:FIINGROUP_DB_PORT = "33306"
docker compose -f docker-compose.integration.yml up -d
```

## Apply migration

```powershell
cd backend.DatabaseMigrator
dotnet run -- --connection "Server=localhost;Port=33306;Database=FiinGroupApp.Identity;User ID=fiingroup_test;Password=use-a-local-only-password" --confirm-database FiinGroupApp.Identity --manifest "..\backend\Database\Migrations\migrations.json"
```

## Stop and remove disposable data

```powershell
docker compose -f docker-compose.integration.yml down -v
```

Do not commit the environment variables or real credentials. Integration tests must verify the database name, migration checksum, no seeded users, password verification, role/permission mapping and session/challenge expiry.
