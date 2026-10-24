import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="container-page py-24 text-center">
      <div className="mx-auto flex w-fit gap-3" aria-hidden="true">
        <div className="mcard h-28 w-20" data-open="true">
          <span className="mcard-inner block">
            <span className="mcard-face mcard-front" data-side="cs">
              <span className="mcard-word text-2xl">404</span>
            </span>
          </span>
        </div>
        <div className="mcard h-28 w-20">
          <span className="mcard-inner block">
            <span className="mcard-face mcard-back">
              <span className="mcard-mark">?</span>
            </span>
          </span>
        </div>
      </div>
      <h1 className="mt-8 text-4xl font-bold tracking-tight">{t("notFound.title")}</h1>
      <p className="mt-3 text-muted">{t("notFound.text")}</p>
      <Link href="/play" className="btn mt-8">
        {t("notFound.cta")}
      </Link>
    </div>
  );
}
