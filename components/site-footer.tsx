import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { SITE } from "@/lib/config";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { t } = await getT();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-sm gap-3">
          <LogoMark size={24} />
          <p className="text-muted">{t("footer.about")}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          <Link href="/play" className="hover:underline">
            {t("nav.play")}
          </Link>
          <Link href="/pricing" className="hover:underline">
            {t("nav.pricing")}
          </Link>
          <Link href="/privacy" className="hover:underline">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t("footer.terms")}
          </Link>
          <a href={`mailto:${SITE.supportEmail}`} className="hover:underline">
            {t("footer.contact")}
          </a>
        </nav>
      </div>
      <div className="container-page pb-10 text-xs text-muted">
        © {new Date().getFullYear()} {SITE.domain}
      </div>
    </footer>
  );
}
