# Legacy Source of Truth Policy

## Authority

`D:\DEV\FiinGroup.Jarvis` is the authoritative reference for the current system's observable behavior during migration. It is used to compare:

- API routes, request/response behavior and error semantics.
- Existing business rules and workflow transitions.
- Permission and role behavior.
- Database relationships and current data meaning.
- External integrations and worker behavior.
- Security findings and compatibility constraints.

## Target ownership

FiinGroupApp remains the target implementation. Its new database/user store is the intended future owner of identity and permissions, but no behavior is considered migrated until it has been compared with the legacy source and accepted by the review team.

## Comparison rule

For every migrated unit, record:

1. Legacy source paths and endpoints.
2. Target components and API contracts.
3. Deliberate behavior changes.
4. Compatibility tests and fixtures.
5. Rollback path.

When documentation conflicts with executable legacy behavior, revalidate the behavior against the source and record the decision in AI-DLC artifacts.
