import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = env.supabaseUrl;
  // Prefer the service-role key (full access). Fall back to the publishable/anon
  // key — works as long as the storage bucket is set to "public".
  const key =
    env.supabaseServiceRoleKey ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return client;
}

export const STORAGE_BUCKET = env.supabaseStorageBucket;
