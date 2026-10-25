import { getEntitlement } from "@/lib/auth";
import { wordsByIds } from "@/lib/decks";
import { sameOrigin } from "@/lib/http";
import { WORD_ID } from "@/lib/review";

/**
 * Review (Premium): POST { ids: ["deckId.wordId", …] } → { words }.
 * Game history stores only word ids; this returns the words with all their
 * translations so the browser doesn't need every deck.
 */
// "All" can be every word on the site.
const MAX_IDS = 10_000;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  if (!(await getEntitlement()).premium) return Response.json({ error: "premium_required" }, { status: 403 });

  let ids: unknown;
  try {
    ids = ((await req.json()) as { ids?: unknown }).ids;
  } catch {
    ids = null;
  }
  if (!Array.isArray(ids) || ids.length > MAX_IDS || !ids.every((id) => typeof id === "string" && WORD_ID.test(id))) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  return Response.json({ words: wordsByIds(ids) }, { headers: { "Cache-Control": "no-store" } });
}
