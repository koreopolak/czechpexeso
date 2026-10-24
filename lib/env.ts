/**
 * Public configuration (safe in the browser). The app runs without any of
 * these: missing Supabase → no accounts (sign-in is Google-only, set up in
 * Supabase); missing Stripe → no payments.
 * NEXT_PUBLIC_* values are inlined at build time, so reference them literally.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export const authEnabled = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);

