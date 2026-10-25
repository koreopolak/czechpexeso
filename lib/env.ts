/**
 * Public configuration (safe in the browser). The app runs without any of
 * these: missing Supabase → no accounts (sign-in is Google-only, set up in
 * Supabase); missing Paddle → no payments.
 * NEXT_PUBLIC_* values are inlined at build time, so reference them literally.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  /** Paddle client-side token (Developer tools → Authentication). Safe to expose. */
  paddleClientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
  /** "sandbox" for testing, "production" (default) for real payments. */
  paddleEnv: (process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production") as "sandbox" | "production",
};

export const authEnabled = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);
