# Migration Principles

1. Migrate one bounded module at a time.
2. Keep the legacy Node.js application operational until the replacement is verified.
3. Preserve legacy API contracts; expose new contracts under `/api/v2`.
4. Keep MySQL/MariaDB as the initial data source of truth.
5. Do not run production migrations automatically at application startup.
6. Every unit needs compatibility tests, rollback instructions, and a human approval gate.
7. Never commit credentials, tokens, OTPs, salary data, or database dumps.
8. Treat the existing reverse-engineering documents as evidence to revalidate, not immutable truth.
