# Legacy Comparison Approach

## Baseline workflow

```text
Legacy source inspection
  → extract observable contract
  → define target contract
  → identify intentional differences
  → implement target slice
  → run comparison tests
  → human acceptance
```

## V1 identity decision

- The new user store remains the target architecture.
- The legacy Jarvis auth/API remains the compatibility reference and temporary adapter for V1 validation.
- No user or permission data is copied to the new store without a separate migration design.
- A mismatch between legacy and target behavior must be recorded, not silently normalized.

## Trust boundary

“Source of truth” means authoritative reference for migration behavior. It does not grant the new application permission to mutate the legacy system beyond explicitly approved compatibility operations.
