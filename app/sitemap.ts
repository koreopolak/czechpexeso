import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { listDecks } from "@/lib/decks";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/play", "/pricing", "/daily", "/privacy", "/terms", "/refunds"].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/play" ? ("weekly" as const) : ("monthly" as const),
    priority: p === "" ? 1 : p === "/play" ? 0.9 : 0.5,
  }));
  const decks = listDecks().map((d) => ({
    url: `${SITE.url}/play/${d.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [...pages, ...decks];
}
