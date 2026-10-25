/**
 * Runs before matching requests. Refreshes the Supabase session cookie so
 * Server Components always see a valid login (they can't write cookies).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, publicEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!authEnabled) return response;

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Validates the JWT and refreshes it when it's about to expire.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Skip static files, images and the Paddle webhook (it has no session).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/paddle/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)"],
};
