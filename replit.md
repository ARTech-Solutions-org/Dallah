# Dallah Conference Registration

Public registration website for the Diabetes & Obesity Conference hosted by Dallah Hospital Al Nakheel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; set `NEON_DATABASE_URL` to use the configured external Neon database instead

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dallah-conference` — public React + Vite registration experience and confirmation state
- `artifacts/api-server/src/routes/registrations.ts` — validated registration API endpoint
- `lib/db/src/schema/registrations.ts` — Drizzle source of truth for attendee registrations
- `lib/api-spec/openapi.yaml` — source of truth for the registration API contract
- `artifacts/dallah-conference/src/index.css` — event visual theme and motion

## Architecture decisions

- The uploaded Dallah event banner is copied into the frontend assets and rendered as an unedited image.
- Client and server validation share the generated OpenAPI contract; the client adds Saudi/international phone UX validation.
- Registration success intentionally replaces the full page with only the requested confirmation message.

## Product

- Displays the official Diabetes & Obesity Conference banner and event details.
- Collects eight required attendee details with inline validation and a duplicate-submit guard.
- Persists registrations to PostgreSQL and displays a personalized confirmation after saving.

## User preferences

- Keep the official banner artwork unchanged.
- Keep the confirmation screen limited to the exact supplied message.

## Gotchas

- The frontend artifact workflow supplies `PORT` and `BASE_PATH`; raw Vite builds need those environment variables set manually.
- Run API codegen after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
