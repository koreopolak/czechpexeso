import type { Metadata } from "next";
import { LEGAL, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

/** Template terms. Have them reviewed; fill in operator details in lib/config.ts (LEGAL). */
export default function TermsPage() {
  return (
    <article className="container-page prose-legal max-w-3xl pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2">Last updated: {LEGAL.updated}</p>

      <h2>The service</h2>
      <p>
        {SITE.name} ({SITE.domain}) is a memory game for learning Czech vocabulary, run by {LEGAL.operator}. All decks are free to
        play with a daily game limit; Premium removes the limit and adds the extra features described on the{" "}
        <a href="/pricing">pricing page</a>.
      </p>

      <h2>Premium</h2>
      <ul>
        <li>
          Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders.
          Paddle provides all customer service inquiries and handles returns. Paddle’s{" "}
          <a href="https://www.paddle.com/legal/checkout-buyer-terms">buyer terms</a> apply to your purchase.
        </li>
        <li>
          Premium is available as a monthly or yearly subscription, billed in advance, which renews automatically until you cancel, or
          as a one-time lifetime purchase, which never renews.
        </li>
        <li>You can cancel a subscription at any time from your account page. Premium then stays active until the end of the paid period.</li>
        <li>
          Lifetime Premium gives you Premium for as long as {SITE.domain} offers it, on the account you bought it with. If you buy it
          while subscribed, your subscription stops renewing automatically.
        </li>
        <li>
          Money-back guarantee: you can get a full refund within 14 days of a purchase — see the <a href="/refunds">refund policy</a>.
          This does not limit your statutory rights as a consumer.
        </li>
        <li>We will tell you by email at least 30 days before any price change takes effect for your subscription.</li>
      </ul>

      <h2>Your account</h2>
      <p>Keep access to your email account secure — it is how you sign in. You can delete your account at any time.</p>

      <h2>Fair use</h2>
      <p>
        Please don’t misuse the service: no attempts to break or overload it, to access content you haven’t paid for by technical means,
        or to copy and redistribute the decks.
      </p>

      <h2>Content</h2>
      <p>
        The game, design and word decks belong to {LEGAL.operator}. We work hard to make translations accurate, but language is
        nuanced; if you spot a mistake, please tell us.
      </p>

      <h2>Liability</h2>
      <p>
        The service is provided as is. To the extent permitted by law, we are not liable for indirect damages. Nothing in these terms
        limits liability that cannot be limited by law.
      </p>

      <h2>Changes and governing law</h2>
      <p>
        We may update these terms; for material changes we will notify account holders in advance. These terms are governed by the law
        of {LEGAL.country}, without depriving consumers of the protection of the mandatory laws of their country of residence.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        {LEGAL.address ? ` · ${LEGAL.address}` : ""}
      </p>
    </article>
  );
}
