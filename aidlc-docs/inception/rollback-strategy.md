# Migration and Rollback Strategy

- Deploy new modules alongside the legacy Jarvis application.
- Route only an approved module to the new frontend/API using configuration or feature flags.
- Keep the legacy route available until compatibility and business acceptance tests pass.
- Roll back by disabling the module flag and routing traffic to the legacy client/API.
- Do not perform irreversible database changes as part of the Application Platform unit.
- Every future schema change must include a version, checksum, rollback note and rehearsal against a disposable database.
