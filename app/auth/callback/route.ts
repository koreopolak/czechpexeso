import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { safeNext, seeOther } from "@/lib/http";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Sign-in landing for magic links and Google. Supports:
 *  - ?code=…                 (Google OAuth, or the default email template — PKCE, same browser only)
 *  - ?token_hash=…&type=…    (recommended template, works in any browser; see README)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"), "/play");
  const supabase = await supabaseServer();
  if (!supabase) return seeOther(req, "/");

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  // Google sends ?error=… when the user cancels or the provider is misconfigured.
  const kind = url.searchParams.get("error") ? "oauth" : "link";
  return seeOther(req, ok ? next : `/login?error=${kind}&next=${encodeURIComponent(next)}`);
}
