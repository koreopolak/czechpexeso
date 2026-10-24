import "server-only";

/** Secrets. Never import this file from client components. */
export const serverEnv = {
  supabaseServiceKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  priceMonthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
  priceYearly: process.env.STRIPE_PRICE_YEARLY ?? "",
  trialDays: Number(process.env.STRIPE_TRIAL_DAYS || 0),
  automaticTax: process.env.STRIPE_AUTOMATIC_TAX === "true",
  /** Local testing only: unlock Premium without Stripe. Ignored in production builds. */
  devPremium: process.env.NODE_ENV !== "production" && process.env.DEV_PREMIUM === "true",
};

export const billingEnabled = Boolean(
  serverEnv.stripeSecretKey && serverEnv.priceMonthly && serverEnv.priceYearly && serverEnv.supabaseServiceKey,
);
