import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { authEnabled, publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions,
 * acting as the signed-in user (RLS applies). Create one per request.
 */
export async function supabaseServer(): Promise<SupabaseClient | null> {
  if (!authEnabled) return null;
  const jar = await cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

let admin: SupabaseClient | null = null;

/** Service-role client that bypasses RLS. Server-side only (webhooks, billing, sync). */
export function supabaseAdmin(): SupabaseClient | null {
  if (!authEnabled || !serverEnv.supabaseServiceKey) return null;
  admin ??= createClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
