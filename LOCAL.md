# Running G-ra locally (Windows, no cloud required)

This guide gets G-ra running on your machine using a **local PostgreSQL** install and
optional **local filesystem** image storage — no Supabase account needed for testing.

## 1. Install PostgreSQL (Windows)

Download the installer from https://www.postgresql.org/download/windows/ (use the
EnterpriseDB "Stack Builder" one-click installer). Defaults are fine, but remember the
password you set for the `postgres` superuser.

After install, open **SQL Shell (psql)** or **pgAdmin** and create a database:

```sql
CREATE DATABASE gra;
```

(Default user `postgres`, default port `5432`.)

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```
AUTH_SECRET=any-long-random-string
DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@localhost:5432/gra?schema=public"
DIRECT_URL="postgresql://postgres:<YOUR_PASSWORD>@localhost:5432/gra?schema=public"
USE_LOCAL_STORAGE=1
```

- `AUTH_SECRET`: run `openssl rand -base64 32` in Git Bash, or just paste a long random string.
- For local testing, leave the `SUPABASE_*` lines blank — image upload uses local files instead.
- `USE_LOCAL_STORAGE=1` makes uploads save to `public/uploads` and be served by Next.js.

## 3. Install deps, create tables, seed admin

```bash
npm install
npm run db:setup        # = prisma db push + seed
```

The seed creates the first admin user and a demo project:

- Email: `admin@g-ra.dev`
- Password: `admin1234`

(Override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` before seeding.)

## 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Sign in with the seeded
admin credentials.

## 5. Try it out

1. Go to **Users** (top nav, admin only) and create a couple of user accounts.
2. On **Projects**, create a project (admin only), then go to its **Members** tab and add
   the users you created.
3. Open the project board and click **New ticket** to create tickets.
4. **Drag** a ticket card from one column to another — its status updates and a history
   entry is recorded.
5. Use the **Assignee** / **date** filters at the top of the board.
6. Open a ticket to see fields, upload an **image**, post a **comment**, and view the
   **History** tab (audit log of all changes).
7. Go to **Settings** to add/reorder **statuses** and define **custom fields**; create a
   new ticket to see the custom fields appear.

## Notes

- The dev server runs on port 3000 by default (`npm run dev -p <port>` to change).
- To reset the database: `npx prisma db push --force-reset` then `npm run db:seed`.
- Switching to Supabase later: fill in the `SUPABASE_*` env vars, remove
  `USE_LOCAL_STORAGE=1`, and create a public `ticket-images` storage bucket.
