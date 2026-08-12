# Identity Provisioning Runbook

The provisioning tool creates an account explicitly after the identity schema has been migrated. It is not an application startup seed and does not store the password in source control.

```powershell
cd backend.IdentityProvisioner
dotnet run -- `
  --connection "<secret connection string>" `
  --confirm-database FiinGroupApp.Identity `
  --username "technical.user" `
  --display-name "Technical User"
```

The password is entered through a hidden console prompt and must be at least 12 characters. Run only against the dedicated FiinGroupApp identity database after the migration runner completes.
