import type { Metadata } from "next";
import { LEGAL, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

/**
 * Template privacy policy matching what the app actually does. Have it
 * reviewed for your situation; fill in operator details in lib/config.ts (LEGAL).
 */
export default function PrivacyPage() {
  return (
    <article className="container-page prose-legal max-w-3xl pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2">Last updated: {LEGAL.updated}</p>

      <h2>Who we are</h2>
      <p>
        {SITE.domain} (“{SITE.name}”, “we”) is run by {LEGAL.operator}
        {LEGAL.address ? `, ${LEGAL.address}` : ""}
        {LEGAL.companyId ? ` (business registration no. ${LEGAL.companyId})` : ""}, {LEGAL.country}. Contact:{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>

      <h2>Playing without an account</h2>
      <p>
        You can play without giving us any personal data. Your game progress is stored only in your browser’s local storage on your
        device and is not sent to us. A small first-party cookie (<code>cp_prefs</code>) remembers your settings, such as language,
        board size and sound. We do not use advertising or tracking cookies.
      </p>

      <h2>If you sign in</h2>
      <p>Sign-in uses your Google account. We receive only what Google shares for sign-in: your name and email address.</p>
      <ul>
        <li>Your email address, to identify your account.</li>
        <li>Authentication cookies that keep you signed in.</li>
        <li>Your subscription status (plan, renewal date) if you buy Premium.</li>
        <li>A copy of your game progress (scores, history and words played), so it can sync between your devices.</li>
      </ul>

      <h2>Payments</h2>
      <p>
        Orders are processed by Paddle.com, our reseller and the Merchant of Record for all purchases. Paddle collects your payment
        and billing details under its own privacy notice (<a href="https://www.paddle.com/legal/privacy">paddle.com/legal/privacy</a>)
        and handles taxes and invoices. We never see or store your card details; Paddle shares with us only what we need to manage
        your Premium plan (for example the plan, its status and renewal date).
      </p>

      <h2>Service providers</h2>
      <ul>
        <li>Supabase — account sign-in and database (hosted in the EU).</li>
        <li>Google — sign-in only.</li>
        <li>Paddle — checkout, payments, taxes and invoices (as Merchant of Record).</li>
        <li>Vercel — website hosting.</li>
      </ul>
      <p>Each provider processes data on our behalf under a data processing agreement.</p>

      <h2>International transfers</h2>
      <p>
        We run the site from {LEGAL.country}; our providers may also process data in the EU, the United States and other countries.
        The European Commission recognises the Republic of Korea as ensuring an adequate level of data protection. Transfers to other
        countries rely on our providers’ standard contractual clauses.
      </p>

      <h2>Legal bases</h2>
      <p>
        We process account and subscription data to provide the service you asked for (contract), keep billing records because the
        law requires it (legal obligation), and keep the service secure (legitimate interest).
      </p>

      <h2>How long we keep data</h2>
      <p>
        Account data and synced progress are kept until you delete your account. Invoices and payment records are kept for as long as
        tax and accounting law requires.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, export or delete your data. Use “Delete my account” on your account page to erase your account and
        synced progress at once, or export your progress from the Progress page. You may also complain to a data protection
        authority: in the Republic of Korea, the Personal Information Protection Commission (PIPC); if you live in the EU or the UK,
        the data protection authority of your country.
      </p>

      <h2>Children</h2>
      <p>
        The game is suitable for all ages and can be played without an account. Accounts and subscriptions are intended to be created
        by adults; parents can create an account for the family.
      </p>
    </article>
  );
}
