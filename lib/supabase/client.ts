"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authEnabled, publicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Browser Supabase client (auth only — data goes through our API routes). */
export function supabaseBrowser(): SupabaseClient | null {
  if (!authEnabled) return null;
  client ??= createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseKey);
  return client;
}
