"use client";

import { useEffect } from "react";
import { useT } from "@/components/providers";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{t("error.title")}</h1>
      <p className="mt-3 text-muted">{t("common.error")}</p>
      <button type="button" className="btn mt-8" onClick={reset}>
        {t("error.retry")}
      </button>
    </div>
  );
}
