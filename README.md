# Czech Pexeso — czechpexeso.net

A memory-match game (Czech: _pexeso_) for learning Czech vocabulary from **English, Ukrainian, Russian or Polish**.
Every pair is a Czech word and its translation. Minimal black-and-white design, works on phones, tablets and desktops,
with Premium (monthly, yearly or lifetime) sold through Paddle.

- **Game:** 4×3, 4×4, 6×4 and 6×6 boards, move counter, optional timer, stars for speed (separate limits per board size), score with streak bonus, best scores
- **Learning:** Czech pronunciation (Web Speech API) after each match, "last pair" bar, word list, end-of-game review; Premium **Review** of the words from recent games as word radio (Czech → translation → Czech on a loop, with a sleep timer), flashcards or a typing game
- **Decks:** 135 themed decks (7,000+ words, grouped by level A1–B2) in JSON, all free to play, easy to extend; each deck shows how many of its words you have played
- **Interface:** English, Ukrainian, Russian, Polish (auto-detected, switchable); light/dark/system theme
- **Sound:** synthesised flip / match / mismatch / win effects (no audio files)
- **Progress:** words played per deck, stars, accuracy, history, daily streak; export/import as JSON
- **Free vs Premium:** free players get 5 games a day plus the daily challenge (a 6×6 board, the same for everyone, not counted toward the 5); Premium adds unlimited games, Review (word radio, flashcards, typing), full history and a Premium badge. `FEATURES.premiumForSale` in `lib/config.ts` turns Premium sales on or off (currently off: the pricing page shows Premium as unavailable)
- **Accounts:** "Continue with Google" sign-in through Supabase (no passwords, no email service to run); progress syncs across devices for every signed-in player
- **Payments:** Paddle (Merchant of Record: handles VAT/sales tax, invoices and refunds) — overlay checkout for monthly, yearly and lifetime plans, local-currency prices, customer portal, webhooks
- **SEO:** server-rendered landing page, metadata, Open Graph image, JSON-LD, sitemap, robots

---

## 1. Run it locally (2 minutes, no accounts needed)

Requirements: **Node.js 20.9 or newer**.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables the game runs fully: all decks, local progress,
pricing page (payments shown as "not enabled yet"). To try Premium (no daily limit, daily challenge) without Paddle, create `.env.local`:

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
| `npm run paddle:setup` | Creates the Premium product + monthly/yearly/lifetime prices (with country prices) in Paddle |

---

## 2. Project structure

```
app/                     Next.js App Router pages and API routes
  page.tsx               Landing page (SEO)
  play/                  Deck selection and /play/[deckId] game
  daily/                 Daily challenge (free, 6×6)
  review/                Review of recent games (Premium): word radio, flashcards, typing
  progress/ settings/    Progress overview, settings
  pricing/ login/ account/
  privacy/ terms/ refunds/  Legal templates
  api/paddle/*           checkout, success, portal, webhook
  api/progress           Cloud progress sync (signed-in players)
  api/review             Words for Review (Premium; history stores only word ids)
  api/account/delete     Account deletion (GDPR)
  auth/callback|signout  Google sign-in landing, sign-out
components/              UI (game/ holds the board, cards, win dialog)
data/decks/*.json        Word decks + index.ts registry
lib/
  game/engine.ts         Pure game logic (deal, flip, scoring) — unit tested
  game/layout.ts         Fits the board to any screen
  progress.ts            Progress model, records, merge (local ⇄ cloud)
  review.ts              Review helpers (recent words, answer checking) — unit tested
  i18n/                  Interface strings (en, uk, ru, pl)
  paddle.ts auth.ts      Billing and entitlement (server only); billing.ts holds the tested pure parts
  config.ts              Free limits, star times, sync switch, fallback prices, legal details
supabase/migrations/     Database schema (run once)
proxy.ts                 Refreshes the login session (Next.js 16 "proxy", formerly middleware)
```

**How Premium is enforced:** subscription and lifetime status are written only by the server (Paddle webhook → `profiles` table,
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
| `NEXT_PUBLIC_LEGAL_COMPANY_ID` | optional | Business registration number (사업자등록번호) if you have one |
| `NEXT_PUBLIC_SUPABASE_URL` | accounts | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | accounts | Supabase → API keys → publishable key (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SECRET_KEY` | accounts + payments | Supabase → API keys → secret key (or legacy `SUPABASE_SERVICE_ROLE_KEY`). **Server only.** |
| `NEXT_PUBLIC_PADDLE_ENV` | payments | `sandbox` for testing, `production` for real payments (default) |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | payments | Paddle → Developer tools → Authentication → client-side token (`test_…` / `live_…`) |
| `PADDLE_API_KEY` | payments | Paddle → Developer tools → Authentication → API key. **Server only.** |
| `PADDLE_WEBHOOK_SECRET` | payments | Paddle → Developer tools → Notifications → your destination → secret key. **Server only.** |
| `PADDLE_PRICE_MONTHLY` | payments | Printed by `npm run paddle:setup` (`pri_…`) |
| `PADDLE_PRICE_YEARLY` | payments | Printed by `npm run paddle:setup` (`pri_…`) |
| `PADDLE_PRICE_LIFETIME` | payments | Printed by `npm run paddle:setup` (`pri_…`) |
| `DEV_PREMIUM` | local only | `true` unlocks Premium in development |

Accounts turn on when the two `NEXT_PUBLIC_SUPABASE_*` values are set. Payments turn on when the Paddle API key, client
token, all three price IDs and the Supabase secret key are set. `NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.

---

## 4. Connect Google sign-in (accounts, subscription status, cloud sync)

Sign-in is **Google only**, handled by Supabase. There are no passwords and no sign-in emails, so you don't need an email service.

**Supabase (about 5 minutes)**

1. Create a project at [supabase.com](https://supabase.com). Pick an **EU region** (e.g. Frankfurt) for GDPR.
2. **SQL Editor → New query**: paste `supabase/migrations/0001_init.sql` and run it, then do the same with
   `0002_paddle.sql` (and any later files, in order).
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

## 5. Connect Paddle (payments)

Paddle is the **Merchant of Record**: it sells Premium to the customer on your behalf, so it collects and pays VAT /
sales tax worldwide, issues invoices and handles refunds and chargebacks. You receive payouts. Sandbox and live are
**separate Paddle accounts** with separate keys and IDs; set up the sandbox first.

1. **Sandbox account** at [sandbox-vendors.paddle.com](https://sandbox-vendors.paddle.com).
2. **Developer tools → Authentication**: create an **API key** (permissions: read + write on products, prices,
   customers, transactions, subscriptions and customer portal sessions) and a **client-side token**. Put them in `.env.local`:

   ```
   NEXT_PUBLIC_PADDLE_ENV=sandbox
   PADDLE_API_KEY=...
   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...
   ```
3. **Create the catalog** — one product, *Czech Pexeso Premium*, with three prices that include tax:
   monthly €2.99, yearly €14.99, lifetime €44.99, plus local prices for Czechia, the US, UK, Poland and Ukraine
   (edit the `CATALOG` table at the top of `scripts/paddle-setup.mjs` first if you want different amounts):

   ```bash
   npm run paddle:setup -- --dry-run   # shows the price table, changes nothing
   npm run paddle:setup                # creates it and prints the PADDLE_PRICE_* lines
   ```

   Copy the three printed `PADDLE_PRICE_*` lines into `.env.local`. Re-running is safe: nothing is duplicated.
4. **Checkout → Checkout settings → Default payment link**: `http://localhost:3000/pricing` in the sandbox,
   `https://czechpexeso.net/pricing` in live. (Paddle requires this before checkouts can be created; links in
   Paddle's emails, such as "update payment method", open the checkout on that page.)
5. **Developer tools → Notifications → New destination**: URL `https://czechpexeso.net/api/paddle/webhook`, events
   `subscription.*` (all), `transaction.completed`, `transaction.paid`, `adjustment.created`, `adjustment.updated`.
   Copy its **secret key** into `PADDLE_WEBHOOK_SECRET`. Paddle can't reach `localhost`; to receive webhooks locally use
   a tunnel (e.g. `npx localtunnel --port 3000`) as the destination URL. Without webhooks, local checkouts still work
   because the success page syncs right away.
6. Run `0002_paddle.sql` in Supabase if you haven't. Sign in, open **Premium**, pick a plan and pay with the test card
   `4242 4242 4242 4242` (any future date, CVC `100`). You return to **Account** with Premium active; try
   *Manage subscription* to open the Paddle portal and cancel.

### What happens behind the scenes

`/api/paddle/checkout` creates a Paddle transaction for the chosen plan (with the user id in its custom data, and the
user's existing Paddle customer if they have one) → the pricing page opens it in Paddle's overlay checkout →
`/api/paddle/success` syncs right away → Paddle webhooks keep the profile in sync afterwards (renewals, cancellations,
failed payments, refunds). Every webhook re-reads the customer's subscriptions and lifetime purchase from Paddle, so
duplicate or out-of-order events are harmless. Premium is granted for a lifetime purchase, or a subscription that is
`active`, `trialing` or `past_due` (grace period while Paddle retries a card). Buying lifetime while subscribed stops
the subscription from renewing; a full refund or chargeback ends the subscription or lifetime access it paid for.

The pricing page shows prices in the visitor's currency (from Paddle, using Vercel's country header), tax included.

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
   `level` is `A1`, `A2`, `B1` or `B2` and decides which section of the deck list it appears in; `order` sorts decks within the list (A1 uses 1–99, A2 101–199, B1 201–299, B2 301–399).
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

**5. Switch Paddle to live**
In your live Paddle account: complete verification and payout details, and get the domain `czechpexeso.net` approved
(Checkout → Website approval; Paddle checks that the pricing, terms, privacy and refund pages are live). Then repeat
section 5 steps 2–5 in the live account (`NEXT_PUBLIC_PADDLE_ENV=production`, a `live_…` client token,
`npm run paddle:setup` with the live API key). Put the live values of all `PADDLE_*` / `NEXT_PUBLIC_PADDLE_*`
variables into Vercel and redeploy.

**6. Final checks**
- Fill in `NEXT_PUBLIC_LEGAL_*` and have the Privacy Policy, Terms and Refund Policy reviewed (templates in `app/privacy`, `app/terms`, `app/refunds`).
- Make `hello@czechpexeso.net` receive mail (registrar forwarding, Cloudflare Email Routing, or your mail provider).
- Smoke test on the live site: sign in with Google on two devices, check progress syncs, subscribe, play past the free limit, play the daily challenge,
  cancel in the portal, refund the test purchase in Paddle, delete a test account.
- Google Search Console: verify the domain (DNS TXT) and submit `https://czechpexeso.net/sitemap.xml`.

No cookie banner is needed by default: the site only uses functional cookies (settings, sign-in) and no tracking.
If you add analytics or ads later, add consent first.
