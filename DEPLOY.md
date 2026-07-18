# Deploying G-ra to Vercel (free)

This deploys G-ra with a **free Supabase** project (Postgres + image Storage) on **Vercel
Hobby** — no paid services required.

## 1. Create a Supabase project (free)

1. Sign up at https://supabase.com and create a new project.
2. In **Project Settings → Database**, copy:
   - **Connection string (pooled)** → this is `DATABASE_URL`
   - **Connection string (direct)** → this is `DIRECT_URL`
   (The pooled one ends in `:6543` with `pgbouncer=true`; the direct one ends in `:5432`.)
3. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (secret!) → `SUPABASE_SERVICE_ROLE_KEY` (preferred)
   - **publishable / anon** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (fallback;
     used automatically if the service-role key is left blank. Works only if the
     storage bucket is set to **public**.)
4. In **Storage**, create a new **public** bucket named `ticket-images`.
   (If you use the publishable/anon key, the bucket MUST be public so uploads work.)

## 2. Push your code to GitHub

```bash
git add -A
git commit -m "Deploy G-ra"
git push
```

(Or just import the folder into Vercel via the CLI / dashboard.)

## 3. Import into Vercel

1. Go to https://vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: leave default (`npm run build`) — but we added `vercel-build`, so
   Vercel will run `prisma migrate deploy` + seed automatically. If Vercel doesn't pick
   it up, set **Build Command** to `npm run vercel-build`.
4. Add the **Environment Variables** (Production + Preview):

| Name | Value |
|------|-------|
| `AUTH_SECRET` | `openssl rand -base64 32` output (any long random string) |
| `POSTGRES_PRISMA_URL` | Supabase **pooled** connection string (injected by the Vercel Supabase integration) |
| `POSTGRES_URL_NON_POOLING` | Supabase **direct** connection string (injected by the integration) |
| `SUPABASE_URL` | Supabase Project URL (injected as `SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (injected; preferred) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key (injected; fallback) |
| `SUPABASE_STORAGE_BUCKET` | `ticket-images` |
| `SEED_ADMIN_EMAIL` | admin email, e.g. `admin@g-ra.dev` |
| `SEED_ADMIN_PASSWORD` | admin password |
| `SEED_ADMIN_NAME` | `Admin` |

> The Vercel Supabase integration already injects `POSTGRES_PRISMA_URL`,
> `POSTGRES_URL_NON_POOLING`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`, so you
> usually only need to add `AUTH_SECRET`, `SUPABASE_STORAGE_BUCKET`, and the
> `SEED_ADMIN_*` vars. Do NOT set `USE_LOCAL_STORAGE` in production.

5. Click **Deploy**. The build runs migrations and seeds the first admin automatically.

## 4. First login

Open the deployed URL → you're redirected to `/login`. Sign in with the
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set. Then create projects, add members,
and open the board.

## Notes

- `prisma migrate deploy` applies migrations without generating; safe for serverless.
- All DB routes use the Node runtime (`export const runtime = "nodejs"`).
- If you later change the Prisma schema, run `npx prisma migrate dev --name <desc>`
  locally, commit the new `prisma/migrations/*`, and redeploy.
- The `service_role` key is server-only and must stay secret (never prefix with
  `NEXT_PUBLIC_`).
