import type { NextRequest } from "next/server";
import { safeNext, seeOther } from "@/lib/http";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Where Google sign-in returns (via Supabase) with ?code=…, which is exchanged
 * for a session cookie. Google adds ?error=… when the player cancels.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"), "/play");
  const supabase = await supabaseServer();
  if (!supabase) return seeOther(req, "/");

  const code = url.searchParams.get("code");
  const { error } = code ? await supabase.auth.exchangeCodeForSession(code) : { error: true };

  return seeOther(req, error ? `/login?error=1&next=${encodeURIComponent(next)}` : next);
}
