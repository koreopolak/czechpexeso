import { headers } from "next/headers";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { LIMITS, SITE } from "@/lib/config";
import { getDeck, listDecks, TOTAL_DECK_COUNT } from "@/lib/decks";
import { formatPrice } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { getPrefs, getT } from "@/lib/i18n/server";
import { getPlanPrices } from "@/lib/paddle";
import { LANG_CODES, LANG_NAMES, SOURCE_LANGS, type SourceLang } from "@/lib/types";

/** How many deck chips the landing page shows before "+N more". */
const SHOWN_DECKS = 16;

/** A static mini board for the hero: a few cards face up, one pair found. */
function HeroBoard({ lang }: { lang: SourceLang }) {
  const animals = getDeck("animals")!.words;
  const w = (id: string) => animals.find((x) => x.id === id)!;
  const cells: ({ text: string; side: "cs" | "src"; found?: boolean } | null)[] = [
    null,
    { text: w("dog").cs, side: "cs", found: true },
    null,
    { text: w("cat")[lang], side: "src" },
    { text: w("dog")[lang], side: "src", found: true },
    null,
    { text: w("owl").cs, side: "cs" },
    null,
    null,
    null,
    null,
    { text: w("fox").cs, side: "cs" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3" aria-hidden="true">
      {cells.map((c, i) => (
        <div key={i} className="mcard aspect-[4/5]" data-open={!!c} data-found={c?.found ?? false}>
          <span className="mcard-inner block">
            <span className="mcard-face mcard-back">
              <span className="mcard-mark">č</span>
            </span>
            {c && (
              <span className="mcard-face mcard-front" data-side={c.side}>
                <span className="mcard-lang">{c.side === "cs" ? "CZ" : LANG_CODES[lang]}</span>
                <span className="mcard-word" style={{ ["--len" as string]: Math.max(4, c.text.length) }}>
                  {c.text}
                </span>
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const country = (await headers()).get("x-vercel-ip-country");
  const [{ t, locale }, { sourceLang }, prices] = await Promise.all([getT(), getPrefs(), getPlanPrices(country)]);
  const decks = listDecks();
  const dog = getDeck("animals")!.words.find((w) => w.id === "dog")!;

  const faq = ([1, 2, 3, 4, 5] as const).map((n) => ({
    q: t(`home.q${n}` as MessageKey),
    a: t(`home.a${n}` as MessageKey),
  }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE.name,
      url: SITE.url,
      applicationCategory: "EducationalApplication",
      genre: "Memory game",
      operatingSystem: "Any",
      inLanguage: ["en", "uk", "ru", "pl", "cs"],
      description: t("home.metaDescription"),
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: prices.month.currency.toUpperCase(), name: t("pricing.freeName") },
        {
          "@type": "Offer",
          price: (prices.month.amount / 100).toFixed(2),
          priceCurrency: prices.month.currency.toUpperCase(),
          name: `Premium — ${t("pricing.monthly")}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  const features: { icon: string; title: MessageKey; text: MessageKey }[] = [
    { icon: "hash", title: "home.f1Title", text: "home.f1Text" },
    { icon: "speaker", title: "home.f2Title", text: "home.f2Text" },
    { icon: "star", title: "home.f3Title", text: "home.f3Text" },
    { icon: "calendar", title: "home.f4Title", text: "home.f4Text" },
    { icon: "sparkle", title: "home.f5Title", text: "home.f5Text" },
    { icon: "people", title: "home.f6Title", text: "home.f6Text" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="container-page grid items-center gap-12 pb-20 pt-12 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="kicker">{t("home.kicker")}</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">{t("home.title")}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">{t("home.lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/play" className="btn btn-lg">
              {t("home.cta")}
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link href="/pricing" className="btn btn-lg btn-outline">
              {t("home.ctaSecondary")}
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted">{t("home.note")}</p>
        </div>
        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <HeroBoard lang={sourceLang} />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface py-20" aria-labelledby="how">
        <div className="container-page">
          <h2 id="how" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("home.howTitle")}
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <li key={n}>
                <span className="text-sm font-semibold tabular-nums text-muted">0{n}</span>
                <h3 className="mt-2 text-xl font-semibold">{t(`home.how${n}Title` as MessageKey)}</h3>
                <p className="mt-2 leading-relaxed text-muted">{t(`home.how${n}Text` as MessageKey)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Languages */}
      <section className="container-page py-20" aria-labelledby="langs">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 id="langs" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("home.langsTitle")}
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">{t("home.langsText")}</p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {SOURCE_LANGS.map((l) => (
              <li key={l} className="panel flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-bold tracking-widest text-muted">{LANG_CODES[l]}</p>
                  <p className="mt-1 font-semibold" lang={l}>
                    {LANG_NAMES[l]}
                  </p>
                </div>
                <p className="text-right text-sm">
                  <span className="text-muted" lang={l}>
                    {dog[l]}
                  </span>
                  <br />
                  <span className="font-semibold" lang="cs">
                    = {dog.cs}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="container-page pb-20" aria-labelledby="features">
        <h2 id="features" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("home.featuresTitle")}
        </h2>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="bg-bg p-7">
              <Icon name={f.icon} size={22} />
              <h3 className="mt-4 font-semibold">{t(f.title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(f.text)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Decks */}
      <section className="container-page pb-20" aria-labelledby="decks">
        <h2 id="decks" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("home.decksTitle")}
        </h2>
        <p className="mt-3 text-lg text-muted">{t("home.decksText", { total: TOTAL_DECK_COUNT })}</p>
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {decks.slice(0, SHOWN_DECKS).map((d) => (
            <li key={d.id}>
              <Link
                href={`/play/${d.id}`}
                className="flex items-center gap-2 rounded-full border border-line py-2 pl-3 pr-4 transition-colors hover:border-fg"
              >
                <Icon name={d.icon} size={18} />
                <span className="font-semibold" lang="cs">
                  {d.title.cs}
                </span>
                <span className="text-sm text-muted">{d.title[sourceLang]}</span>
              </Link>
            </li>
          ))}
          {decks.length > SHOWN_DECKS && (
            <li>
              <Link href="/play" className="flex items-center gap-2 rounded-full bg-invert py-2 pl-4 pr-3 font-semibold text-invert-fg">
                {t("home.moreDecks", { n: decks.length - SHOWN_DECKS })}
                <Icon name="arrow-right" size={16} />
              </Link>
            </li>
          )}
        </ul>
      </section>

      {/* Pricing teaser */}
      <section className="container-page pb-20">
        <div className="flex flex-col gap-6 rounded-3xl bg-invert p-8 text-invert-fg sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("home.pricingTitle")}</h2>
            <p className="mt-3 text-lg opacity-75">{t("home.pricingText")}</p>
            <p className="mt-4 text-sm opacity-60">
              {t("pricing.free3", { n: LIMITS.freeGamesPerDay })} · Premium{" "}
              {formatPrice(prices.month.amount, prices.month.currency, locale)} {t("pricing.perMonth")}
            </p>
          </div>
          <Link href="/pricing" className="btn btn-lg shrink-0 border-invert-fg bg-invert-fg text-invert">
            {t("home.pricingCta")}
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page pb-20" aria-labelledby="faq">
        <h2 id="faq" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("home.faqTitle")}
        </h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {f.q}
                <span className="text-2xl font-light text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{t("home.finalTitle")}</h2>
        <Link href="/play" className="btn btn-lg mt-8">
          {t("home.finalCta")}
          <Icon name="arrow-right" size={18} />
        </Link>
      </section>
    </>
  );
}
