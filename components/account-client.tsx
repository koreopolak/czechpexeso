"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/components/providers";

/**
 * After checkout the webhook may arrive a moment after the redirect. Refresh
 * the page a few times until Premium shows up.
 */
export function ActivationWatcher({ active }: { active: boolean }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (active || tries >= 10) return;
    const id = window.setTimeout(() => {
      setTries((n) => n + 1);
      router.refresh();
    }, 2500);
    return () => window.clearTimeout(id);
  }, [active, tries, router]);
  return null;
}

export function DeleteAccountButton() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <form
      action="/api/account/delete"
      method="post"
      onSubmit={(e) => {
        if (!window.confirm(t("account.deleteConfirm"))) e.preventDefault();
        else setBusy(true);
      }}
    >
      <button type="submit" className="btn btn-outline btn-sm border-danger text-danger" disabled={busy}>
        {t("account.delete")}
      </button>
    </form>
  );
}
