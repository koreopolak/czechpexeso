# Czech Pexeso — czechpexeso.net

A memory-match game (Czech: _pexeso_) for learning Czech vocabulary from **English, Ukrainian, Russian or Polish**.
Every pair is a Czech word and its translation. Minimal black-and-white design, works on phones, tablets and desktops,
with a light Premium subscription through Stripe.

- **Game:** 4×3, 4×4, 6×4 and 6×6 boards, move counter, optional timer, stars for speed (separate limits per board size), score with streak bonus, best scores
- **Learning:** Czech pronunciation (Web Speech API) after each match, "last pair" bar, word list, end-of-game review
- **Decks:** 60 themed decks (3,000+ words, grouped by level A1–B1) in JSON, all free to play, easy to extend; each deck shows how many of its words you have played
- **Interface:** English, Ukrainian, Russian, Polish (auto-detected, switchable); light/dark/system theme
- **Sound:** synthesised flip / match / mismatch / win effects (no audio files)
- **Progress:** words played per deck, stars, accuracy, history, daily streak; export/import as JSON
- **Free vs Premium:** free players get 5 games a day; Premium adds unlimited games, the daily challenge, full history and a Premium badge
- **Accounts:** "Continue with Google" sign-in through Supabase (no passwords, no email service to run); progress syncs across devices for every signed-in player
- **Payments:** Stripe Checkout (monthly + yearly), Customer Portal, webhooks
- **SEO:** server-rendered landing page, metadata, Open Graph image, JSON-LD, sitemap, robots

---

## 1. Run it locally (2 minutes, no accounts needed)

Requirements: **Node.js 20.9 or newer**.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables the game runs fully: all decks, local progress,
pricing page (payments shown as "not enabled yet"). To try Premium (no daily limit, daily challenge) without Stripe, create `.env.local`:

```
DEV_PREMIUM=true
```

(`DEV_PREMIUM` is ignored in production builds.)

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (game engine, scoring, progress merge, layout, i18n) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run validate:decks` | Checks every deck file (missing translations, duplicates, size) |
| `npm run stripe:setup` | Creates the Premium product + monthly/yearly prices in Stripe |

---

## 2. Project structure

```
app/                     Next.js App Router pages and API routes
  page.tsx               Landing page (SEO)
  play/                  Deck selection and /play/[deckId] game
  daily/                 Daily challenge (Premium)
  progress/ settings/    Progress overview, settings
  pricing/ login/ account/
  privacy/ terms/        Legal templates
  api/stripe/*           checkout, success, portal, webhook
  api/progress           Cloud progress sync (signed-in players)
  api/account/delete     Account deletion (GDPR)
  auth/callback|signout  Google sign-in landing, sign-out
components/              UI (game/ holds the board, cards, win dialog)
data/decks/*.json        Word decks + index.ts registry
lib/
  game/engine.ts         Pure game logic (deal, flip, scoring) — unit tested
  game/layout.ts         Fits the board to any screen
  progress.ts            Progress model, records, merge (local ⇄ cloud)
  i18n/                  Interface strings (en, uk, ru, pl)
  stripe.ts auth.ts      Billing and entitlement (server only)
  config.ts              Free limits, star times, sync switch, fallback prices, legal details
supabase/migrations/     Database schema (run once)
proxy.ts                 Refreshes the login session (Next.js 16 "proxy", formerly middleware)
```

**How Premium is enforced:** subscription status is written only by the server (Stripe webhook → `profiles` table,
protected by Row Level Security), and the daily challenge board is only sent to Premium players. The free limit of
5 games a day is counted in the browser (and synced for signed-in players), so it is a light limit by design.

---

## 3. Environment variables

Copy `.env.example` to `.env.local` locally; add the same keys in Vercel → Project → Settings → Environment Variables.

| Variable | Required for | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | production | `https://czechpexeso.net` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | optional | Shown in footer/legal pages (default `hello@czechpexeso.net`) |
| `NEXT_PUBLIC_LEGAL_OPERATOR` | production | Your name or company, shown on /privacy and /terms |
| `NEXT_PUBLIC_LEGAL_ADDRESS` | production | Your business address |
| `NEXT_PUBLIC_LEGAL_COMPANY_ID` | optional | Company ID (IČO) if you have one |
| `NEXT_PUBLIC_SUPABASE_URL` | accounts | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | accounts | Supabase → API keys → publishable key (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SECRET_KEY` | accounts + payments | Supabase → API keys → secret key (or legacy `SUPABASE_SERVICE_ROLE_KEY`). **Server only.** |
| `STRIPE_SECRET_KEY` | payments | Stripe → Developers → API keys (`sk_test_…` / `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | payments | Stripe → Webhooks → your endpoint → Signing secret (`whsec_…`) |
| `STRIPE_PRICE_MONTHLY` | payments | Printed by `npm run stripe:setup` (`price_…`) |
| `STRIPE_PRICE_YEARLY` | payments | Printed by `npm run stripe:setup` (`price_…`) |
| `STRIPE_TRIAL_DAYS` | optional | Free-trial days for new subscribers, e.g. `7` (default `0`) |
| `STRIPE_AUTOMATIC_TAX` | optional | `true` to let Stripe Tax add EU VAT (enable Stripe Tax first) |
| `DEV_PREMIUM` | local only | `true` unlocks Premium in development |

Accounts turn on when the two `NEXT_PUBLIC_SUPABASE_*` values are set. Payments turn on when the Stripe key,
both price IDs and the Supabase secret key are set. `NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.

---

## 4. Connect Google sign-in (accounts, subscription status, cloud sync)

Sign-in is **Google only**, handled by Supabase. There are no passwords and no sign-in emails, so you don't need an email service.

**Supabase (about 5 minutes)**

1. Create a project at [supabase.com](https://supabase.com). Pick an **EU region** (e.g. Frankfurt) for GDPR.
2. **SQL Editor → New query**: paste `supabase/migrations/0001_init.sql` and run it.
3. **Authentication → Sign In / Providers → Email**: turn **off**. The site doesn't use it, and leaving it off stops anyone
   from creating email accounts through Supabase's API.
4. **Authentication → URL Configuration**
   - Site URL: `https://czechpexeso.net`
   - Redirect URLs: `https://czechpexeso.net/auth/callback**` and, for local testing, `http://localhost:3000/auth/callback**`
5. **Project Settings → API keys**: copy the Project URL, the publishable key and the secret key (see the table in section 3).
   Locally they go in `.env.local`; on the live site, in Vercel → Settings → Environment Variables (then redeploy).

**Google (about 10 minutes)**

1. [Google Cloud Console](https://console.cloud.google.com) → create a project (e.g. *Czech Pexeso*).
2. **APIs & Services → OAuth consent screen** (called *Google Auth Platform* in newer consoles): User type **External**,
   app name *Czech Pexeso*, your support email, authorized domain `czechpexeso.net`. Only the basic scopes are needed
   (`openid`, `email`, `profile`), so Google doesn't require a review. Add links to
   `https://czechpexeso.net/privacy` and `https://czechpexeso.net/terms`, then **Publish app** (until then only test
   users you list can sign in).
3. **Credentials → Create credentials → OAuth client ID → Web application**
   - Authorized JavaScript origins: `https://czechpexeso.net` and `http://localhost:3000`
   - Authorized redirect URI: the callback URL shown in Supabase on the Google provider page,
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret** into Supabase → **Authentication → Sign In / Providers → Google**, enable it, save.

The sign-in page now shows **Continue with Google**. Progress syncs for every signed-in player; set
`FEATURES.syncForEveryone = false` in `lib/config.ts` to make sync Premium-only.

> Google's sign-in screen shows the Supabase address (`…supabase.co`) as the site being signed in to. To show
> `czechpexeso.net` instead, Supabase offers a paid custom-domain add-on; it's optional.

---

## 5. Connect Stripe (payments)

### Test mode first

1. Create a Stripe account; stay in **test mode** (sandbox).
2. Create the product and prices (defaults: €3.99/month, €29.99/year, prices include VAT):

   ```bash
   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
   # custom: npm run stripe:setup -- --currency=eur --monthly=399 --yearly=2999
   ```

   Copy the printed `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` and your `STRIPE_SECRET_KEY` into `.env.local`.
   (PowerShell: `$env:STRIPE_SECRET_KEY="sk_test_..."; npm run stripe:setup`.)
3. **Customer Portal:** Dashboard → Settings → Billing → Customer portal → enable *cancel subscriptions*,
   *switch plans* (add both prices), *update payment methods* and *invoice history* → Save.
4. **Webhooks locally** with the [Stripe CLI](https://docs.stripe.com/stripe-cli):

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Put the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` and restart the dev server.
5. Sign in, open **Premium**, subscribe with test card `4242 4242 4242 4242` (any future date, any CVC).
   You return to **Account** with Premium active; try *Manage subscription* to cancel.

### What happens behind the scenes

`/api/stripe/checkout` creates (once) a Stripe customer linked to the user and opens Checkout →
`/api/stripe/success` syncs the subscription immediately → Stripe webhooks keep it in sync afterwards
(renewals, cancellations, failed payments). Every webhook re-reads the subscription from Stripe, so duplicate or
out-of-order events are harmless. Premium is granted for `active`, `trialing` and `past_due` (grace period while
Stripe retries a card).

### Taxes

Selling digital subscriptions to EU consumers means charging VAT of the buyer's country (EU OSS). The easiest route is
**Stripe Tax**: activate it in the Dashboard, then set `STRIPE_AUTOMATIC_TAX=true`. Ask an accountant about
registration (OSS) for your situation.

---

## 6. Add a deck

1. Copy `data/decks/colors.json` to `data/decks/<id>.json` and edit it:

   ```json
   {
     "id": "weather",
     "order": 13,
     "level": "A1",
     "icon": "leaf",
     "title": { "cs": "Počasí", "en": "Weather", "uk": "Погода", "ru": "Погода", "pl": "Pogoda" },
     "description": { "en": "…", "uk": "…", "ru": "…", "pl": "…" },
     "words": [
       { "id": "rain", "cs": "déšť", "en": "rain", "uk": "дощ", "ru": "дождь", "pl": "deszcz" }
     ]
   }
   ```

   At least **18 words** (enough for the 6×6 board). Optional per word: `"note"` (shown in word lists).
   `level` is `A1`, `A2` or `B1` and decides which section of the deck list it appears in; `order` sorts decks within the list.
   Icons: any name from `components/icons.tsx` (e.g. `book`, `car`, `heart`, `bulb`; add more there).
2. Import it in `data/decks/index.ts` and add it to the list.
3. `npm run validate:decks` — catches missing translations, duplicate texts (two different cards must never look identical) and words that already appear in another deck.

New decks are automatically included in the deck list, the daily challenge and the sitemap.

## 7. Add an interface language

Add `lib/i18n/messages/<code>.ts` typed as `Messages` (TypeScript lists any missing key), register it in
`lib/i18n/index.ts`, and add the code to `UI_LOCALES` in `lib/types.ts`. To add a *card* language, also add it to
`SOURCE_LANGS` and to every deck.

## 8. Tuning

`lib/config.ts`: free games per day (default 5, `0` = unlimited), visible free history (10), star time limits per board
size (`STAR_SECONDS`, e.g. 4×4: 3 stars under 45 s, 2 stars under 80 s), cloud sync for everyone (`FEATURES`), fallback prices,
daily-challenge time zone (Europe/Prague) and size, legal details.

---

## 9. Deploy and go live on czechpexeso.net

The app is a standard Next.js 16 app. Vercel is the simplest host (note: Vercel's free *Hobby* plan is for
non-commercial use; a site with paid subscriptions needs *Pro*). Any Node host also works: `npm run build && npm start`.

**1. Put the code on GitHub**

```bash
git init
git add .
git commit -m "Czech Pexeso"
```

Create an empty repository on GitHub and push to it.

**2. Deploy on Vercel**
Vercel → Add New → Project → import the repository → add all environment variables (with
`NEXT_PUBLIC_SITE_URL=https://czechpexeso.net`) → Deploy.

**3. Connect the domain**
Vercel → Project → Settings → Domains → add `czechpexeso.net` and `www.czechpexeso.net`. Make `czechpexeso.net` the main
domain (*Connect to an environment → Production*) and set `www.czechpexeso.net` to *Redirect to* `czechpexeso.net` (308).
Don't keep Vercel's default of redirecting the bare domain to www: the site's links, sitemap and sign-in/payment URLs all
use `https://czechpexeso.net`.
At your domain registrar, create the DNS records Vercel shows — usually an `A` record for `@` → `76.76.21.21` and a
`CNAME` for `www` → the `…vercel-dns.com` target — or switch the domain's nameservers to Vercel. HTTPS is issued automatically.

**4. Point Supabase at the real domain**
Authentication → URL Configuration: Site URL `https://czechpexeso.net`; Redirect URLs add
`https://czechpexeso.net/auth/callback**`. In Google Cloud, make sure `https://czechpexeso.net` is an authorized
JavaScript origin and the consent screen is published.

**5. Switch Stripe to live**
Activate your Stripe account (business details, bank account, statement descriptor e.g. `CZECHPEXESO`, support email).
In **live mode**: run `npm run stripe:setup` with your `sk_live_…` key, configure the Customer Portal again, and add a
webhook endpoint `https://czechpexeso.net/api/stripe/webhook` with these events:
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`,
`customer.subscription.trial_will_end`, `invoice.paid`, `invoice.payment_failed`.
Put the live `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and price IDs into Vercel and redeploy.

**6. Final checks**
- Fill in `NEXT_PUBLIC_LEGAL_*` and have the Privacy Policy and Terms reviewed (templates in `app/privacy`, `app/terms`).
- Make `hello@czechpexeso.net` receive mail (registrar forwarding, Cloudflare Email Routing, or your mail provider).
- Smoke test on the live site: sign in with Google on two devices, check progress syncs, subscribe, play past the free limit, play the daily challenge,
  cancel in the portal, delete a test account.
- Google Search Console: verify the domain (DNS TXT) and submit `https://czechpexeso.net/sitemap.xml`.

No cookie banner is needed by default: the site only uses functional cookies (settings, sign-in) and no tracking.
If you add analytics or ads later, add consent first.
