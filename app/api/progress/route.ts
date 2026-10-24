import { getEntitlement, requireUser } from "@/lib/auth";
import { FEATURES } from "@/lib/config";
import { sameOrigin } from "@/lib/http";
import { emptyProgress, mergeProgress, parseProgress } from "@/lib/progress";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Cloud progress for signed-in players (Premium only if FEATURES.syncForEveryone is false).
 *   GET → the stored progress
 *   PUT → merge the sent progress with the stored one, save, return the result
 * Merging on the server means a stale device can never erase newer progress.
 */
const MAX_BYTES = 512 * 1024;

async function authorize() {
  const user = await requireUser();
  if (!user) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  if (!FEATURES.syncForEveryone && !(await getEntitlement()).premium) return { error: Response.json({ error: "premium_required" }, { status: 403 }) };
  const db = supabaseAdmin();
  if (!db) return { error: Response.json({ error: "not_configured" }, { status: 501 }) };
  return { user, db };
}

export async function GET() {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.db.from("user_progress").select("data").eq("user_id", auth.user.id).maybeSingle();
  if (error) return Response.json({ error: "db_error" }, { status: 500 });
  return Response.json(parseProgress(data?.data) ?? emptyProgress(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const auth = await authorize();
  if ("error" in auth) return auth.error;

  const body = await req.text();
  if (body.length > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  let incoming;
  try {
    incoming = parseProgress(JSON.parse(body));
  } catch {
    incoming = null;
  }
  if (!incoming) return Response.json({ error: "invalid" }, { status: 400 });

  const { data: row } = await auth.db.from("user_progress").select("data").eq("user_id", auth.user.id).maybeSingle();
  const merged = mergeProgress(parseProgress(row?.data) ?? emptyProgress(), incoming);

  const { error } = await auth.db
    .from("user_progress")
    .upsert({ user_id: auth.user.id, data: merged, updated_at: new Date().toISOString() });
  if (error) return Response.json({ error: "db_error" }, { status: 500 });

  return Response.json(merged, { headers: { "Cache-Control": "no-store" } });
}
