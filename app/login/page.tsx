import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getEntitlement } from "@/lib/auth";
import { safeNext } from "@/lib/http";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("login.metaTitle"), robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const [{ t }, { user, authEnabled }, params] = await Promise.all([getT(), getEntitlement(), searchParams]);
  const next = safeNext(params.next);
  if (user) redirect(next);

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-center text-4xl font-bold tracking-tight">{t("login.title")}</h1>
        {authEnabled ? (
          <>
            <p className="mt-3 text-center text-muted">{t("login.why")}</p>
            {params.error && (
              <p className="mt-6 rounded-2xl bg-surface p-4 text-sm" role="alert">
                {params.error === "oauth" ? t("common.error") : t("login.linkError")}
              </p>
            )}
            <LoginForm next={next} />
            <p className="mt-8 text-center text-xs text-muted">
              {t("login.legal")}{" "}
              <Link href="/terms" className="underline">
                {t("footer.terms")}
              </Link>{" "}
              ·{" "}
              <Link href="/privacy" className="underline">
                {t("footer.privacy")}
              </Link>
            </p>
          </>
        ) : (
          <p className="mt-6 rounded-2xl bg-surface p-5 text-center text-muted">{t("login.disabled")}</p>
        )}
      </div>
    </div>
  );
}
