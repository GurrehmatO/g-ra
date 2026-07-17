# G-ra

A free, self-hostable **Jira-board alternative** built with Next.js, deployable on Vercel
with a free Supabase Postgres database.

## Features

- **Email / password auth** with an `ADMIN` role. Access is admin-generated: only an admin
  can create user accounts (no public sign-up).
- **Projects** created by admins. Members are added per project.
- **Configurable board statuses** (columns) and **custom fields** (text / number / select /
  date) defined per project.
- **Tickets** of type `STORY` or `BUG` with title, description, assignee, creator, status,
  images, and custom-field values. Any project member can create tickets.
- **Drag & drop** kanban board — drop a ticket into another column to change its status.
- **Filters** by assignee and by created-date range.
- **Ticket detail** view with all fields, an **image gallery** (upload to Supabase Storage),
  a **comments** section, and a full **change-history (audit) log**.

## Tech stack

- Next.js 14 (App Router) + React + TypeScript
- Auth.js v5 (`Credentials` provider, JWT sessions)
- Prisma + Supabase Postgres
- Supabase Storage for images
- `@dnd-kit` for drag-and-drop
- Tailwind CSS

## Local development

1. Create a Supabase project (free tier).
2. Create a Storage bucket named `ticket-images` (set it **Public** for simple image URLs).
3. Copy `.env.example` to `.env` and fill in the values from Supabase:
   - `DATABASE_URL` = pooled connection string (`6543` / `pgbouncer=true`)
   - `DIRECT_URL` = direct connection string (`5432`)
   - `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_SECRET` = `openssl rand -base64 32`
4. Install deps and push the schema:
   ```bash
   npm install
   npm run db:push
   npm run db:seed   # creates the first ADMIN user + a demo project
   npm run dev
   ```
5. Sign in with the seeded admin credentials (`admin@g-ra.dev` / `admin1234` by default —
   override via `SEED_ADMIN_*` env vars).

## Deploy to Vercel (free)

1. Push this repo to GitHub and import it into Vercel.
2. Add the same environment variables (see `.env.example`) in the Vercel project settings.
3. Set the build command to `npm run build` and ensure `prisma generate` runs (it runs
   automatically via the `postinstall` script).
4. Run `npm run db:push` once locally (or via Vercel's CLI / a Supabase migration) to create
   the tables, then `npm run db:seed` to create the first admin.
5. Deploy. Open the production URL, sign in, and create projects / tickets.

### Prisma on Vercel notes

- All database routes use the Node runtime (`export const runtime = "nodejs"`).
- Use the **pooled** `DATABASE_URL` for the app and the **direct** `DIRECT_URL` for
  migrations, as recommended for Supabase + serverless.

## Project structure

```
prisma/            # schema + seed
src/app/           # routes (auth, api, board pages)
src/components/     # board, tickets, projects, auth UI
src/lib/           # prisma, auth, supabase, history helpers
```
