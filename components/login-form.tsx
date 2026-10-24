"use client";

/**
 * Sign-in with Google, or passwordless email: Supabase emails a magic link
 * *and* a one-time code. The link is easiest on the same device; the code works
 * when the email is opened somewhere else (or in an in-app browser).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useT } from "@/components/providers";
import { googleAuthEnabled } from "@/lib/env";
import { supabaseBrowser } from "@/lib/supabase/client";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function LoginForm({ next }: { next: string }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const google = async () => {
    const supabase = supabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // On success the browser is already on its way to Google.
    if (error) {
      setBusy(false);
      setError(t("common.error"));
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) {
      setError(error.status === 429 ? t("login.rateLimited") : t("common.error"));
      return;
    }
    setStep("code");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setBusy(false);
      setError(t("login.badCode"));
      return;
    }
    router.replace(next);
    router.refresh();
  };

  if (step === "code") {
    return (
      <form onSubmit={verify} className="mt-8">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface">
          <Icon name="check" size={26} />
        </div>
        <h2 className="mt-4 text-center text-2xl font-semibold">{t("login.sentTitle")}</h2>
        <p className="mt-2 text-center text-muted">{t("login.sentText", { email: email.trim() })}</p>
        <label htmlFor="code" className="sr-only">
          {t("login.code")}
        </label>
        <input
          id="code"
          className="field mt-6 text-center text-2xl font-semibold tracking-[0.4em] tabular-nums"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          maxLength={10}
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoFocus
        />
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn mt-4 w-full" disabled={busy || code.length < 6}>
          {busy ? t("login.verifying") : t("login.verify")}
        </button>
        <button
          type="button"
          className="btn btn-ghost mt-2 w-full"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
        >
          {t("login.again")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={send} className="mt-8">
      {googleAuthEnabled && (
        <>
          <button type="button" className="btn btn-outline w-full gap-3" onClick={google} disabled={busy}>
            <GoogleLogo />
            {t("login.google")}
          </button>
          <div className="my-6 flex items-center gap-3 text-sm text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            {t("login.or")}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <label htmlFor="email" className="text-sm font-medium">
        {t("login.email")}
      </label>
      <p className="mt-0.5 text-sm text-muted">{t("login.lead")}</p>
      <input
        id="email"
        type="email"
        className="field mt-2"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn mt-4 w-full" disabled={busy}>
        {busy ? t("login.sending") : t("login.send")}
      </button>
    </form>
  );
}
