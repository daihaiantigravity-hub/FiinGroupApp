# Construction — Authentication Target Backend

## Current increment

The .NET backend now contains the target authentication contracts and service boundary:

- `IUserStore` owns lookup, password verification and permission retrieval.
- `IAuthService` owns authentication orchestration.
- HTTP composition remains in `Program.cs`.
- `/api/v2/auth/login` is defined but cannot authenticate until a database-backed user store is configured.

## Safety boundary

The registered `DevelopmentUserStore` has no seeded users and rejects all credentials. This prevents accidental insecure accounts while the new database schema and password/2FA migration design are being finalized.

The authentication orchestration is covered by backend unit tests for empty input, unknown users, password rejection and successful permission loading.

## Next implementation

Add a MySQL/MariaDB-backed `IUserStore`, password hash policy, user/role/permission schema, 2FA challenge service, and contract tests. Do not enable it in production until comparison tests against the legacy auth contract pass.
