import type { Metadata } from "next";
import { LEGAL, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Refund Policy", alternates: { canonical: "/refunds" } };

/** Template refund policy. Paddle reviews it before approving the domain; keep it in line with the Terms. */
export default function RefundsPage() {
  return (
    <article className="container-page prose-legal max-w-3xl pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight">Refund Policy</h1>
      <p className="mt-2">Last updated: {LEGAL.updated}</p>

      <h2>14-day money-back guarantee</h2>
      <p>
        If {SITE.name} Premium is not for you, you can get a full refund within 14 days of any purchase — the first payment of a
        monthly or yearly subscription, a renewal, or a lifetime purchase. No reason needed.
      </p>

      <h2>How to ask for a refund</h2>
      <p>
        Purchases are processed by Paddle.com, our reseller and Merchant of Record, so refunds are paid by Paddle to your original
        payment method. To ask for one, either:
      </p>
      <ul>
        <li>
          reply to your receipt email or use <a href="https://paddle.net">paddle.net</a> to find your order and request a refund, or
        </li>
        <li>
          write to <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> with the email address you paid with, and we will
          arrange it.
        </li>
      </ul>
      <p>Refunds usually reach your account within 5–10 business days, depending on your bank.</p>

      <h2>After a refund</h2>
      <p>
        A refunded purchase ends Premium for the period it paid for: a refunded subscription is cancelled, and refunded lifetime
        access is removed. Your account, progress and free play stay as they are.
      </p>

      <h2>Cancelling a subscription</h2>
      <p>
        You can cancel at any time from your account page; you keep Premium until the end of the period you have paid for and are not
        charged again. Cancelling after the 14-day window does not refund the current period.
      </p>

      <h2>Your statutory rights</h2>
      <p>This policy does not limit any rights you have as a consumer under the law of your country.</p>
    </article>
  );
}
