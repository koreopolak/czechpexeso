"use client";

import type { ReactNode } from "react";
import { usePrefs, useI18n } from "@/components/providers";
import type { Theme } from "@/lib/prefs";
import { speakCzech, useCzechVoice } from "@/lib/speech";
import { GRID_SIZES, LANG_NAMES, pairsForGrid, SOURCE_LANGS, UI_LOCALES } from "@/lib/types";

function Row({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="max-w-md">
        <label htmlFor={htmlFor} className="font-medium">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="kicker">{title}</h2>
      <div className="mt-2 divide-y divide-line border-y border-line">{children}</div>
    </section>
  );
}

export function SettingsForm() {
  const { t, locale } = useI18n();
  const { prefs, setPrefs } = usePrefs();
  const voice = useCzechVoice();

  const voiceText =
    voice.status === "ready" ? t("settings.voiceReady", { name: voice.name ?? "" })
    : voice.status === "missing" ? t("settings.voiceMissing")
    : voice.status === "unsupported" ? t("settings.voiceUnsupported")
    : t("settings.voiceLoading");

  return (
    <>
      <p className="mt-3 text-muted">{t("settings.saved")}</p>

      <Section title={t("settings.language")}>
        <Row label={t("settings.uiLanguage")} htmlFor="ui-lang">
          <select
            id="ui-lang"
            className="field min-w-56"
            value={locale}
            onChange={(e) => setPrefs({ locale: e.target.value as (typeof UI_LOCALES)[number] })}
          >
            {UI_LOCALES.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.sourceLanguage")} hint={t("settings.sourceHint")} htmlFor="src-lang">
          <select
            id="src-lang"
            className="field min-w-56"
            value={prefs.sourceLang ?? ""}
            onChange={(e) => setPrefs({ sourceLang: (e.target.value || undefined) as (typeof SOURCE_LANGS)[number] | undefined })}
          >
            <option value="">
              {t("settings.sameAsUi")} ({LANG_NAMES[locale]})
            </option>
            {SOURCE_LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title={t("settings.game")}>
        <Row label={t("settings.grid")} hint={t("common.pairs", { n: pairsForGrid(prefs.grid) })}>
          <div className="segmented" role="group" aria-label={t("settings.grid")}>
            {GRID_SIZES.map((g) => (
              <button key={g} type="button" aria-pressed={g === prefs.grid} onClick={() => setPrefs({ grid: g })} title={t(`grid.${g}`)}>
                {g.replace("x", "×")}
              </button>
            ))}
          </div>
        </Row>
        <Row label={t("settings.timer")} hint={t("settings.timerHint")} htmlFor="timer">
          <input id="timer" type="checkbox" className="switch" checked={prefs.timer} onChange={(e) => setPrefs({ timer: e.target.checked })} />
        </Row>
        <Row label={t("settings.sound")} htmlFor="sound">
          <input id="sound" type="checkbox" className="switch" checked={prefs.sound} onChange={(e) => setPrefs({ sound: e.target.checked })} />
        </Row>
      </Section>

      <Section title={t("settings.speech")}>
        <div className="py-5 text-sm" role="status">
          <p className={voice.status === "ready" ? "font-medium" : "text-muted"}>{voiceText}</p>
        </div>
        <Row label={t("settings.speak")} htmlFor="speak">
          <input
            id="speak"
            type="checkbox"
            className="switch"
            checked={prefs.speak}
            disabled={voice.status !== "ready"}
            onChange={(e) => setPrefs({ speak: e.target.checked })}
          />
        </Row>
        <Row label={t("settings.rate")} htmlFor="rate">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{t("settings.rateSlow")}</span>
            <input
              id="rate"
              type="range"
              min={0.6}
              max={1.2}
              step={0.1}
              value={prefs.speechRate}
              onChange={(e) => setPrefs({ speechRate: Number(e.target.value) })}
              className="w-32 accent-[var(--fg)]"
            />
            <span className="text-sm text-muted">{t("settings.rateNormal")}</span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={voice.status !== "ready"}
              onClick={() => speakCzech("Dobrý den! Jak se máš?", prefs.speechRate)}
            >
              {t("settings.test")}
            </button>
          </div>
        </Row>
      </Section>

      <Section title={t("settings.appearance")}>
        <Row label={t("settings.appearance")}>
          <div className="segmented" role="group" aria-label={t("settings.appearance")}>
            {(["system", "light", "dark"] as Theme[]).map((th) => (
              <button key={th} type="button" aria-pressed={prefs.theme === th} onClick={() => setPrefs({ theme: th })}>
                {t(th === "system" ? "settings.themeSystem" : th === "light" ? "settings.themeLight" : "settings.themeDark")}
              </button>
            ))}
          </div>
        </Row>
      </Section>
    </>
  );
}
