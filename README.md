# GSOS — Global School OS (Starter Monorepo)

This is the *aligned* starter codebase for the GSOS project:
- Clean, ChatGPT-style UI using **TailwindCSS**.
- Two Next.js apps: **Client Portal** and **Admin Console**.
- **AWS CDK v2** for infra (Cognito, DynamoDB, S3, API Gateway + Lambda).
- **Lambda API** service with a working `/health` endpoint.
- Shared packages for **ui**, **types**, and **utils**.
- **Tray.io** integration placeholder.
- CI via GitHub Actions and workspace tooling via pnpm + Turborepo.

> See `Design Requirements Document (DRD) - GSOS.docx` for detailed requirements.
  Keep this repo consistent with the DRD and expand domains (Students, Guardians, Staff, Classes, Terms, Assessments, Attendance, Billing).

## Quick Start

```bash
# Install deps
pnpm install

# Dev (run local API + web apps)
pnpm -C services/api start &
pnpm -C apps/web dev &
PORT=3001 pnpm -C apps/admin dev

# Deploy infra (after AWS credentials & CDK bootstrap)
pnpm infra:deploy
```

## Repo Structure
```
apps/
  web/     # Client-facing portal
  admin/   # Admin/staff console
services/
  api/     # Lambda handlers + local stub
  auth/    # Cognito triggers
infra/
  cdk/     # AWS CDK app & stacks
packages/
  ui/      # Shared UI (Tailwind components)
  types/   # Zod schemas and types
  utils/   # Helpers
integrations/
  tray/    # Tray.io placeholder
```

---

### Notes
- UI follows *GSOS preview* (minimal, narrow column, black on white).
- Tailwind is configured locally in each Next.js app.
- Keep infra minimal for first deploy; add more stacks/constructs as needed.
