# FiinGroupApp Project Brief

## Goal

Incrementally modernize the Jarvis internal management system with a React + TypeScript + Vite frontend and an ASP.NET Core .NET 8 backend.

## Migration strategy

Migrate by module while the existing Node.js/Express Jarvis system remains operational. The new backend uses `/api/v2`; legacy APIs remain unchanged unless an explicit compatibility change is approved.

## Initial unit

Application Platform: React shell, typed API clients, .NET Web API skeleton, health checks, OpenAPI, structured logging, configuration, security boundaries, and CI-ready build/test commands.

## In scope for the initial unit

- React TypeScript strict-mode shell and routing foundation.
- .NET API composition and `/api/v2` boundary.
- Environment-specific configuration without committed secrets.
- Standard error handling and health endpoint.
- Legacy API compatibility boundary.
- AI-DLC documentation and review checkpoints.

## Out of scope for the initial unit

- Rewriting all Jarvis modules.
- Production database schema changes.
- Replacing authentication, TFS/NTLM, chatbot, payroll, approval, or finance workflows.
- Big-bang cutover.

## Success criteria

The platform builds from a clean checkout, documents its decisions, does not modify the legacy application, and provides a tested foundation for the next migration unit.
