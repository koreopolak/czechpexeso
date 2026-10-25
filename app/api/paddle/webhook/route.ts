import { serverEnv } from "@/lib/env.server";
import { cancelAfterRefund, paddle, syncCustomer } from "@/lib/paddle";

/**
 * Paddle webhook endpoint: https://czechpexeso.net/api/paddle/webhook
 * Every relevant event just re-syncs that customer from Paddle, so retries,
 * duplicates and out-of-order delivery are all harmless.
 */
const PREFIXES = ["subscription.", "transaction.completed", "transaction.paid", "adjustment."];

export async function POST(req: Request) {
  if (!serverEnv.paddleApiKey || !serverEnv.paddleWebhookSecret) {
    return new Response("Paddle is not configured", { status: 501 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event;
  try {
    // The raw body is required for signature verification.
    event = await paddle().webhooks.unmarshal(await req.text(), serverEnv.paddleWebhookSecret, signature);
  } catch (e) {
    console.warn("[paddle] bad webhook signature", e instanceof Error ? e.message : e);
    return new Response("Invalid signature", { status: 400 });
  }

  if (PREFIXES.some((p) => event.eventType.startsWith(p))) {
    const data = event.data as {
      customerId?: string | null;
      customData?: Record<string, unknown> | null;
      // Adjustments (refunds, chargebacks) only:
      action?: string;
      type?: string;
      status?: string;
      subscriptionId?: string | null;
    };
    const userId = typeof data.customData?.user_id === "string" ? data.customData.user_id : null;
    const fullRefund =
      event.eventType.startsWith("adjustment.") &&
      (data.action === "refund" || data.action === "chargeback") &&
      data.type === "full" &&
      data.status === "approved";
    if (data.customerId) {
      try {
        if (fullRefund && data.subscriptionId) await cancelAfterRefund(data.subscriptionId);
        await syncCustomer(data.customerId, userId);
      } catch (e) {
        console.error(`[paddle] sync failed for ${event.eventType}`, e);
        // 500 makes Paddle retry later.
        return new Response("Sync failed", { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
