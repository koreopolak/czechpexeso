/**
 * Public configuration (safe in the browser). The app runs without any of
 * these: missing Supabase → no accounts; missing Stripe → no payments.
 * NEXT_PUBLIC_* values are inlined at build time, so reference them literally.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export const authEnabled = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);

/** Show "Continue with Google" (enable the Google provider in Supabase first — see README). */
export const googleAuthEnabled = authEnabled && process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";
