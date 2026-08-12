# Unit Inventory and Risk

| Unit | Risk | Main dependencies |
|---|---:|---|
| Application Platform | Medium | None; establishes conventions |
| Authentication/profile | High | JWT, 2FA, TFS/Redmine identity, permissions |
| Shared UI/data | Medium | Platform and API contracts |
| Dashboard | Medium | Aggregated reporting APIs |
| Wiki/documents | Medium | Upload/download, sanitization, permissions |
| Project management | High | PM data, approvals, cost, TFS |
| Approval workflow | Very high | Cross-domain state transitions |
| HR | High | Employee and organizational data |
| Salary/finance | Critical | Sensitive data, encryption, calculations |
| Chatbot | High | External service, SSE, admin trust boundary |
| Integrations/workers | High | SMTP, TFS/NTLM, scheduled jobs |
| Operations | High | Deployment, secrets, monitoring, rollback |
