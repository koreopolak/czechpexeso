import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { ProgressSync } from "@/components/progress-sync";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getEntitlement } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { getMessages } from "@/lib/i18n";
import { getPrefs, getT } from "@/lib/i18n/server";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-onest",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return {
    metadataBase: new URL(SITE.url),
    title: { default: t("home.metaTitle"), template: `%s · ${SITE.name}` },
    description: t("home.metaDescription"),
    applicationName: SITE.name,
    keywords: ["Czech", "learn Czech", "Czech vocabulary", "pexeso", "memory game", "čeština", "чеська мова", "чешский язык", "język czeski"],
    openGraph: {
      type: "website",
      siteName: SITE.name,
      url: SITE.url,
      title: t("home.metaTitle"),
      description: t("home.metaDescription"),
      locale: { en: "en_GB", uk: "uk_UA", ru: "ru_RU", pl: "pl_PL" }[locale],
    },
    twitter: { card: "summary_large_image", title: t("home.metaTitle"), description: t("home.metaDescription") },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ prefs, locale }, entitlement] = await Promise.all([getPrefs(), getEntitlement()]);

  return (
    <html
      lang={locale}
      data-theme={prefs.theme === "system" ? undefined : prefs.theme}
      className={onest.variable}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <AppProviders locale={locale} messages={getMessages(locale)} prefs={prefs} entitlement={entitlement}>
          <ProgressSync />
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
