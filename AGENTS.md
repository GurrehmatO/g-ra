# AGENTS.md

Compact guidance for OpenCode sessions working in **G-ra** (a self-hostable Jira-board alternative).

## Stack & entrypoints
- Next.js 14 App Router + React + TypeScript. Server runtime is **Node.js** — every DB API route must keep `export const runtime = "nodejs"` (Prisma can't run on Edge). Verify with `src/app/api/**/route.ts`.
- Single package, no monorepo. Source layout: `prisma/` (schema + seed), `src/app/` (routes), `src/components/`, `src/lib/`.
- `src/lib/` holds the wiring: `prisma.ts` (client singleton), `auth.ts` (Auth.js v5 config), `session.ts` (authz helpers like `requireAdmin`/`requireProjectMember`), `supabase.ts`, `history.ts` (audit-log helper).

## Developer commands
- `npm run dev` — dev server on :3000.
- `npm run build` / `npm start` — production build/serve.
- `npm run lint` — `next lint` (extends `next/core-web-vitals`; no extra rules configured).
- `npm run db:push` — push Prisma schema to DB (no migrations are used; schema is the source of truth).
- `npm run db:seed` — seed first ADMIN + demo project (uses `tsx prisma/seed.ts`). `npm run db:setup` = push + seed.
- `prisma generate` runs automatically via `postinstall`. After editing `prisma/schema.prisma`, run it manually if `@prisma/client` types are stale.
- No test suite exists. Do not invent `npm test`.

## Setup / environment quirks
- Copy `.env.example` → `.env`. Local dev can run on a local Postgres DB with the SUPABASE_* vars blank (see `LOCAL.md`).
- `DATABASE_URL` = pooled connection, `DIRECT_URL` = direct (5432) for `prisma db push`. On Supabase they differ — keep the split.
- Image upload optional: set `USE_LOCAL_STORAGE=1` to write to `public/uploads` (no Supabase needed); otherwise needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + a public `ticket-images` bucket. Everything else works without Supabase.
- Seed admin defaults: `admin@g-ra.dev` / `admin1234` (override via `SEED_ADMIN_*` env vars before seeding).

## Auth & routing gotchas
- Auth.js v5 with **Credentials** provider and **JWT** sessions (no DB sessions). `auth()` is also used as the middleware in `src/middleware.ts`.
- The middleware `matcher` only protects `/projects`, `/api/projects`, and `/api/tickets`. It does **not** cover `/users` or `/api/users` — those rely on `requireAdmin()` server-side checks instead. Don't assume all routes are middleware-protected.
- Route groups: `(auth)` and `(board)` organize URLs but don't appear in the path. Authz is enforced per-page via `requireUser`/`requireAdmin`/`requireProjectMember` in `src/lib/session.ts`.
- There is **no public sign-up**; only an ADMIN can create users.

## Conventions
- Path alias `@/*` → `src/*` (tsconfig). Import app code with `@/lib/...`, not relative paths.
- Custom field types per project: text / number / select / date. Ticket status changes and edits are recorded by `src/lib/history.ts` (audit log shown in the ticket History tab).
- Tailwind + `clsx`/`tailwind-merge` for class composition (see `src/lib/utils.ts`).
