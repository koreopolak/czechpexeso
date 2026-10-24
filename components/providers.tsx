"use client";

/**
 * App-wide client context: translations, preferences and the player's
 * entitlement (signed-in user + Premium). All three are resolved on the server
 * and handed down from the root layout, so the first paint is already right.
 */
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createT, INTL_LOCALE, type Messages, type TFunction } from "@/lib/i18n/translate";
import { PREFS_COOKIE, serializePrefs, type Prefs } from "@/lib/prefs";
import type { Entitlement, SourceLang, UiLocale } from "@/lib/types";

type I18n = { locale: UiLocale; intl: string; t: TFunction };
type PrefsCtx = { prefs: Prefs; sourceLang: SourceLang; setPrefs: (patch: Partial<Prefs>) => void };

const I18nContext = createContext<I18n | null>(null);
const PrefsContext = createContext<PrefsCtx | null>(null);
const EntitlementContext = createContext<Entitlement | null>(null);

function writePrefsCookie(prefs: Prefs) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PREFS_COOKIE}=${serializePrefs(prefs)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function AppProviders({
  locale,
  messages,
  prefs: initialPrefs,
  entitlement,
  children,
}: {
  locale: UiLocale;
  messages: Messages;
  prefs: Prefs;
  entitlement: Entitlement;
  children: ReactNode;
}) {
  const router = useRouter();
  const [prefs, setPrefsState] = useState<Prefs>(initialPrefs);

  const i18n = useMemo<I18n>(() => ({ locale, intl: INTL_LOCALE[locale], t: createT(locale, messages) }), [locale, messages]);

  const setPrefs = useCallback(
    (patch: Partial<Prefs>) => {
      setPrefsState((prev) => {
        const next = { ...prev, ...patch };
        writePrefsCookie(next);
        return next;
      });
      // The interface language is rendered on the server: re-render with the new cookie.
      if (patch.locale) router.refresh();
    },
    [router],
  );

  // Apply the theme immediately (the server applies it on the next request).
  useEffect(() => {
    const el = document.documentElement;
    if (prefs.theme === "system") delete el.dataset.theme;
    else el.dataset.theme = prefs.theme;
  }, [prefs.theme]);

  const prefsValue = useMemo<PrefsCtx>(
    () => ({ prefs, sourceLang: prefs.sourceLang ?? prefs.locale ?? locale, setPrefs }),
    [prefs, locale, setPrefs],
  );

  return (
    <I18nContext.Provider value={i18n}>
      <PrefsContext.Provider value={prefsValue}>
        <EntitlementContext.Provider value={entitlement}>{children}</EntitlementContext.Provider>
      </PrefsContext.Provider>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside AppProviders");
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}

export function usePrefs(): PrefsCtx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside AppProviders");
  return ctx;
}

export function useEntitlement(): Entitlement {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error("useEntitlement must be used inside AppProviders");
  return ctx;
}
