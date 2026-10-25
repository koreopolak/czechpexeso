import { requireUser } from "@/lib/auth";
import { billingEnabled } from "@/lib/env.server";
import { seeOther } from "@/lib/http";
import { paddle, syncCustomer } from "@/lib/paddle";

/**
 * Paddle Checkout redirects here after payment. We sync right away so Premium
 * is active on the next page, without waiting for the webhook (which still
 * arrives and is handled idempotently).
 */
export async function GET(req: Request) {
  const transactionId = new URL(req.url).searchParams.get("transaction_id");
  const user = await requireUser();
  if (billingEnabled && transactionId?.startsWith("txn_") && user) {
    try {
      const txn = await paddle().transactions.get(transactionId);
      if (txn.customerId && txn.customData?.user_id === user.id) await syncCustomer(txn.customerId, user.id);
    } catch (e) {
      console.error("[paddle] success sync failed", e);
    }
  }
  return seeOther(req, "/account?welcome=1");
}
