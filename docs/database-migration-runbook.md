# Database Migration Runbook

1. Create a dedicated empty database for FiinGroupApp.
2. Configure credentials through deployment secrets, never source files.
3. Run `backend/Database/Migrations/001_identity.sql` against that database only.
4. Verify tables, foreign keys and unique indexes.
5. Confirm no rows were seeded in `app_users`.
6. Record database name, migration checksum and execution timestamp.
7. Do not point the application at the database until the .NET store and tests are complete.

8. Update and verify `backend/Database/Migrations/migrations.json` before applying any migration.

## TFS identity mapping

After `002_external_identities.sql` is applied and an approved target user exists, create an explicit mapping with the dedicated provisioner:

```powershell
cd backend.IdentityMappingProvisioner
$identityConnection = "Server=localhost;Port=33306;Database=FiinGroupApp.Identity;User ID=fiingroup_test;Password=<local-secret>"
dotnet run -- --connection $identityConnection --confirm-database FiinGroupApp.Identity --username "<target-user>" --provider tfs --subject "STOXPLUS-CORP\Hai.NguyenVan"
```

Replace `<local-secret>` and `<target-user>` with real values. The `--subject` can be the TFS `authenticatedUser.id`, `uniqueName`, or `DOMAIN\username`; it must not remain a placeholder. The command refuses a different database, refuses to create users, refuses to overwrite another mapping, and does not grant roles or permissions. Permission grants require a separate reviewed operation.

## Migration runner

The standalone runner is `backend.DatabaseMigrator`. It refuses any database other than the explicitly confirmed `FiinGroupApp.Identity` database and verifies migration checksums before execution.

```powershell
cd backend.DatabaseMigrator
dotnet run -- --connection "<secret connection string>" --confirm-database FiinGroupApp.Identity --manifest "..\backend\Database\Migrations\migrations.json"
```

Do not put the connection string in a committed file or shell history in shared environments. The runner is not invoked by the web API.

Rollback in a disposable environment means dropping the new database. Production rollback requires an approved backup/restore procedure; never drop a shared or legacy database.
