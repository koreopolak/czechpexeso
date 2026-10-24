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
        {SITE.name} ({SITE.domain}) is a memory game for learning Czech vocabulary, run by {LEGAL.operator}. Some decks are free;
        Premium unlocks all decks and extra features described on the <a href="/pricing">pricing page</a>.
      </p>

      <h2>Premium subscription</h2>
      <ul>
        <li>Premium is billed monthly or yearly in advance through Stripe and renews automatically until you cancel.</li>
        <li>You can cancel at any time from your account page. Premium then stays active until the end of the paid period.</li>
        <li>
          Money-back guarantee: if you are not happy, write to <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> within
          14 days of your first payment and we will refund it in full. This does not limit your statutory rights as a consumer.
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
