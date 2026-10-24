import { sameOrigin, seeOther } from "@/lib/http";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const supabase = await supabaseServer();
  await supabase?.auth.signOut();
  return seeOther(req, "/");
}
