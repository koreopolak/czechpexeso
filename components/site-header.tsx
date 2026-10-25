"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { useEntitlement, useI18n, usePrefs } from "@/components/providers";
import { FEATURES } from "@/lib/config";
import type { MessageKey } from "@/lib/i18n/translate";
import { LANG_CODES, LANG_NAMES, UI_LOCALES } from "@/lib/types";

const NAV: { href: string; key: MessageKey; premium?: boolean }[] = [
  { href: "/play", key: "nav.play" },
  { href: "/daily", key: "nav.daily" },
  { href: "/review", key: "nav.review", premium: true },
  { href: "/progress", key: "nav.progress" },
  { href: "/pricing", key: "nav.pricing" },
];

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`chip chip-solid ${className}`}>
      <Icon name="sparkle" size={12} filled strokeWidth={0} />
      Premium
    </span>
  );
}

export function SiteHeader() {
  const { t, locale } = useI18n();
  const { setPrefs } = usePrefs();
  const { user, premium, authEnabled } = useEntitlement();
  const pathname = usePathname();
  // The mobile menu remembers the page it was opened on, so it closes itself after navigating.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // Premium-only pages are listed for Premium players, and for everyone while Premium is on sale.
  const nav = NAV.filter((n) => !n.premium || premium || FEATURES.premiumForSale);
  // Five links don't fit beside the controls on a tablet, so the menu button stays until lg.
  const wide = nav.length > 4;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 btn btn-sm">
        {t("nav.skip")}
      </a>
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav className={`ml-6 hidden items-center gap-1 ${wide ? "lg:flex" : "md:flex"}`} aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface ${
                active(n.href) ? "text-fg" : "text-muted"
              }`}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <label className="relative hidden sm:block">
            <span className="sr-only">{t("nav.language")}</span>
            <select
              value={locale}
              onChange={(e) => setPrefs({ locale: e.target.value as (typeof UI_LOCALES)[number] })}
              className="h-9 cursor-pointer appearance-none rounded-full border border-line bg-bg pl-3 pr-7 text-sm font-semibold hover:bg-surface"
            >
              {UI_LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LANG_CODES[l]} · {LANG_NAMES[l]}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </label>

          <Link href="/settings" className="btn btn-ghost btn-icon hidden sm:inline-flex" aria-label={t("nav.settings")} title={t("nav.settings")}>
            <Icon name="sliders" />
          </Link>

          {authEnabled &&
            (user ? (
              // Icon-only circle on small screens; the email joins it on wide ones. Premium shows as a star.
              <Link
                href="/account"
                className="btn btn-outline btn-sm gap-2 max-xl:w-9 max-xl:px-0"
                aria-label={premium ? `${t("nav.account")} · ${t("common.premium")}` : t("nav.account")}
                title={premium ? `${t("nav.account")} · ${t("common.premium")}` : t("nav.account")}
              >
                {premium ? <Icon name="sparkle" size={18} filled strokeWidth={0} /> : <Icon name="user" size={18} />}
                <span className="hidden max-w-32 truncate xl:inline">{user.email}</span>
              </Link>
            ) : (
              <Link href="/login" className="btn btn-sm hidden sm:inline-flex">
                {t("nav.signIn")}
              </Link>
            ))}
          {!authEnabled && premium && (
            <span className="grid size-9 place-items-center" title={t("common.premium")} aria-label={t("common.premium")} role="img">
              <Icon name="sparkle" size={18} filled strokeWidth={0} />
            </span>
          )}

          <button
            type="button"
            className={`btn btn-ghost btn-icon ${wide ? "lg:hidden" : "md:hidden"}`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t("nav.menu")}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className={`border-t border-line ${wide ? "lg:hidden" : "md:hidden"}`} aria-label="Main">
          <div className="container-page flex flex-col gap-1 py-3">
            {[...nav, { href: "/settings", key: "nav.settings" as MessageKey }].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                className={`rounded-xl px-3 py-3 text-base font-medium hover:bg-surface ${active(n.href) ? "bg-surface" : ""}`}
              >
                {t(n.key)}
              </Link>
            ))}
            {authEnabled && !user && (
              <Link href="/login" className="btn mt-2">
                {t("nav.signIn")}
              </Link>
            )}
            <div className="mt-3 flex items-center gap-3 px-1">
              <Icon name="globe" size={18} className="text-muted" />
              <div className="segmented" role="group" aria-label={t("nav.language")}>
                {UI_LOCALES.map((l) => (
                  <button key={l} type="button" aria-pressed={l === locale} onClick={() => setPrefs({ locale: l })} lang={l}>
                    {LANG_CODES[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
