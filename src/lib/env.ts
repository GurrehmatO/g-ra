/**
 * Central env resolution. Supports both the Vercel Supabase integration
 * (POSTGRES_ and SUPABASE_ vars) and a manual .env (DATABASE_URL / DIRECT_URL /
 * NEXT_PUBLIC_SUPABASE_URL). Add new fallbacks here only.
 */

export const env = {
  // Prisma reads POSTGRES_PRISMA_URL (pooled) and POSTGRES_URL_NON_POOLING
  // (direct) directly from schema.prisma; these are exposed for reference/tests.
  databaseUrl:
    process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? "",
  directUrl:
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.DIRECT_URL ?? "",

  supabaseUrl:
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "",

  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    "",

  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "ticket-images",
};
