import { NextResponse } from "next/server";
import { SITE } from "@/lib/config";

/** Only allow redirects to paths on this site (no "//evil.com", no absolute URLs). */
export function safeNext(value: string | null | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/**
 * Origin for building absolute URLs: the configured site URL in production
 * (safe behind proxies), the request's own origin locally and on Vercel previews.
 */
export function originOf(req: Request): string {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview") return SITE.url;
  return new URL(req.url).origin;
}

/** 303 so browsers follow form POSTs with a GET. */
export function seeOther(req: Request, path: string) {
  const url = path.startsWith("http") ? path : `${originOf(req)}${path}`;
  return NextResponse.redirect(url, 303);
}

/**
 * Basic CSRF protection for cookie-authenticated POST routes: the request must
 * come from our own pages. Browsers always send Origin on cross-site POSTs.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
