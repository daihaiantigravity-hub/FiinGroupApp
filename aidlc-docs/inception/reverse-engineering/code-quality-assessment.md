# Code Quality Assessment

## Test Coverage

- **Overall**: Poor/unknown; no automated test suite or coverage configuration found.
- **Unit tests**: None found.
- **Integration tests**: No dedicated tests; `test:db` is declared but `server/test-db.js` is absent.
- **Static validation**: `node --check server/index.js` passed. Full dependency/runtime validation was not possible because `node_modules` is absent.

## Code Quality Indicators

| Indicator | Assessment | Evidence |
|---|---|---|
| Module separation | Fair | Routes/services/helpers/middleware are separated, but many route modules mix SQL, validation, and business logic. |
| Database safety | Mixed | Central query helper uses bound parameters; dynamic SQL fragments and direct SQL are distributed across routes/migrations. |
| Error handling | Mixed | Global error handler exists, but routes use inconsistent envelopes and extensive console logging. |
| Documentation | Fair locally / poor system-wide | Many files have useful comments, but no architecture/API/operations contract existed before this analysis. |
| Operational maturity | Fair | Job logs, worker locks, health endpoint, and environment guards exist; no CI/process/container definition was found. |
| Testability | Poor | `app.listen()` occurs in the composition file, dependencies are hard-wired, and no test harness exists. |
| Security posture | Mixed/high risk | Several hardening measures exist, but multiple high-impact trust-boundary and secret-handling issues remain. |

## Priority Findings

### Critical / high priority

1. **Chatbot proxy trust boundary is outside the global API auth guard.**
   - Evidence: `server/index.js` mounts `/chatbot-api` and `/chatbot-admin-api`, while the global guard only protects paths beginning `/api/`.
   - Evidence: `server/routes/chatbot-proxy.js` resolves actor identity from `X-Debug-User`, query `debugUser`, or a default actor; the admin proxy forwards admin CRUD operations without a local authentication/authorization middleware.
   - Impact: An internet-reachable caller may impersonate an actor or invoke chatbot administration operations unless an upstream network control fully isolates these paths.
   - Recommendation: Require the same JWT and explicit chatbot-admin permission locally; derive actor identity only from verified claims; remove debug identity from production builds/configuration; add route-level tests for every destructive proxy operation.

2. **API access logging can record secrets and sensitive request bodies.**
   - Evidence: `server/index.js` wraps `res.end` and logs JSON bodies for POST/PUT requests. This includes `/api/auth/login` credentials, OTP payloads, salary/financial values, and potentially uploaded metadata.
   - Impact: Credentials, OTPs, PII, and payroll data can enter console/process logs and downstream log aggregation.
   - Recommendation: Use structured allowlisted audit fields; never log passwords, OTPs, authorization headers, tokens, or financial bodies; redact by route and field; add log-retention/access controls.

3. **Hardcoded accounts bypass 2FA.**
   - Evidence: `server/routes/auth.js` has a `bypassUsers` list containing named production accounts.
   - Impact: Compromise of one bypassed password becomes direct session issuance regardless of configured 2FA policy.
   - Recommendation: Remove the list; use a time-bound, audited emergency break-glass mechanism stored outside source control and protected by separate controls.

4. **Encryption strategy is inconsistent and includes a hardcoded database key.**
   - Evidence: application encryption uses `ENCRYPTION_KEY` with AES-GCM/AES-CBC derivation, while deployment SQL embeds `REDMINE_SECRET_KEY_2025` in `AES_ENCRYPT/AES_DECRYPT` functions.
   - Evidence: `.env.example` documents `SALARY_ENCRYPT_KEY`, while `server/config/encryption-key.js` requires `ENCRYPTION_KEY`.
   - Impact: Configuration drift, possible inability to decrypt data across paths, and source/deployment exposure of a payroll encryption key.
   - Recommendation: Define one key-management contract, migrate to a secret manager/KMS, version key identifiers, document rotation and re-encryption, and remove plaintext key material from SQL/source.

5. **Manual worker endpoints are authenticated but not visibly permission-gated.**
   - Evidence: `POST /api/jobs/calc-cost`, `/snapshot-balances`, and `/lock-weekly-cost` are defined directly in `server/index.js`; the global JWT guard applies, but no admin/operation permission guard is attached.
   - Impact: Any valid API user may trigger expensive or state-changing background operations.
   - Recommendation: Restrict to an explicit operational/admin permission, add idempotency and concurrency controls, and disable manual triggers in production unless explicitly enabled.

### Medium priority

6. **Stateless JWT logout does not revoke tokens.** `auth.js` returns success while token deletion is commented out and the active token store is not used by verification. Use short-lived access tokens plus refresh-token rotation/revocation or a server-side denylist for sensitive sessions.

7. **In-memory OTP/rate-limit state is not multi-instance safe.** `otpPendingStore` and login rate limits disappear on restart and are not shared between instances. Move them to a durable/shared store or enforce single-instance deployment with explicit availability tradeoffs.

8. **No uniform API contract or route inventory is machine-checked.** Introduce OpenAPI (or generated route metadata), standard response envelopes, validation schemas, and contract tests.

9. **Static frontend tokens are stored in local/session storage.** `js/utils.js` and `js/runtime-config.js` read `authToken` from browser storage. With the breadth of `innerHTML` usage, a single XSS can expose tokens. Prefer HttpOnly, Secure, SameSite cookies where compatible, add a strict CSP, and centralize safe rendering/sanitization.

10. **Deployment and migration governance is fragmented.** There are 189 migration files with repeated numbering/repair scripts and startup auto-migration guards. Add an authoritative migration ledger, checksum/versioning, rollback policy, and CI migration rehearsal against a disposable database.

## Good Patterns

- Global deny-by-default JWT guard for `/api/*` was added as defense in depth.
- CORS has an explicit allowlist and security headers disable `x-powered-by`.
- Uploads have MIME/extension allowlists, generated filenames, folder sanitization, and a 10 MB limit.
- DB query paths generally use parameter placeholders and transactions are available.
- Permission checks fail closed on lookup errors, and permission caches are cleared through a helper.
- Cost and worker operations include lock/job-log mechanisms to reduce duplicate processing.
- Rich-text/server HTML sanitization utilities are present.

## Anti-patterns / Technical Debt

- Composition, routing, startup migration checks, worker startup, and direct server listening are all concentrated in `server/index.js`.
- Route handlers frequently combine transport, validation, SQL, authorization assumptions, and business transitions.
- Legacy and current authentication middleware coexist (`auth.js` and `authMiddleware.js`) with different role representations.
- Debug/proxy behavior is reachable through production source paths.
- Console/file logging is not consistently redacted or centrally governed.
- No automated regression suite protects payroll, approvals, permissions, cost calculations, or uploads.

## Recommended Remediation Sequence

1. Close chatbot/admin proxy authorization and remove actor spoofing in production.
2. Redact API/database logs and rotate any credentials/secrets that may have been logged or embedded.
3. Remove hardcoded 2FA bypass accounts and formalize emergency access.
4. Unify encryption configuration and move key material to managed secrets/KMS.
5. Gate manual jobs and sensitive routes with explicit permissions.
6. Add a test harness around auth, permissions, approvals, payroll, cost calculations, uploads, and proxy trust boundaries.
7. Establish API/migration contracts, CI checks, and observability with safe structured logs.
