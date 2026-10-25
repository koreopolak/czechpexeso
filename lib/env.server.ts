import "server-only";

import { publicEnv } from "@/lib/env";

/** Secrets. Never import this file from client components. */
export const serverEnv = {
  supabaseServiceKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  paddleApiKey: process.env.PADDLE_API_KEY ?? "",
  paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
  priceMonthly: process.env.PADDLE_PRICE_MONTHLY ?? "",
  priceYearly: process.env.PADDLE_PRICE_YEARLY ?? "",
  priceLifetime: process.env.PADDLE_PRICE_LIFETIME ?? "",
  /** Local testing only: unlock Premium without Paddle. Ignored in production builds. */
  devPremium: process.env.NODE_ENV !== "production" && process.env.DEV_PREMIUM === "true",
};

export const billingEnabled = Boolean(
  serverEnv.paddleApiKey &&
    publicEnv.paddleClientToken &&
    serverEnv.priceMonthly &&
    serverEnv.priceYearly &&
    serverEnv.priceLifetime &&
    serverEnv.supabaseServiceKey,
);
