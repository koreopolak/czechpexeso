"use client";

/**
 * Czech pronunciation through the Web Speech API. Uses a voice installed on
 * the device; when none speaks Czech we say so instead of reading Czech with
 * an English voice.
 */
import { useSyncExternalStore } from "react";
import type { SourceLang } from "@/lib/types";

export type VoiceStatus = "unsupported" | "loading" | "missing" | "ready";
type VoiceState = { status: VoiceStatus; name: string | null };

function supported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Best installed voice for a language ("cs", "en", "uk", …), or null. */
export function findVoice(lang: "cs" | SourceLang): SpeechSynthesisVoice | null {
  if (!supported()) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
  // Prefer higher-quality voices when several are installed.
  const rank = (v: SpeechSynthesisVoice) => (/(natural|neural|premium|enhanced|online)/i.test(v.name) ? 0 : 1);
  return voices.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

export function findCzechVoice(): SpeechSynthesisVoice | null {
  return findVoice("cs");
}

export function speakCzech(text: string, rate = 0.9) {
  const voice = findCzechVoice();
  if (!voice) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  synth.speak(u);
  return true;
}

/**
 * Says `text` and resolves when it has been spoken (or interrupted).
 * Resolves false straight away when no voice speaks the language.
 * A timeout guards against browsers that never fire `end`.
 */
export function speakAndWait(text: string, lang: "cs" | SourceLang, rate = 0.9): Promise<boolean> {
  const voice = findVoice(lang);
  if (!voice) return Promise.resolve(false);
  return new Promise((resolve) => {
    let timer = 0;
    const done = () => {
      window.clearTimeout(timer);
      resolve(true);
    };
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    u.onend = done;
    u.onerror = done;
    timer = window.setTimeout(done, (2500 + text.length * 180) / rate);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (supported()) window.speechSynthesis.cancel();
}

// Voices load asynchronously, so availability is a tiny external store.
const SERVER_STATE: VoiceState = { status: "loading", name: null };
let state: VoiceState = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();

function set(next: VoiceState) {
  if (next.status === state.status && next.name === state.name) return;
  state = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  if (!supported()) {
    set({ status: "unsupported", name: null });
    return;
  }
  const update = () => {
    const v = findCzechVoice();
    if (v) set({ status: "ready", name: v.name });
    else if (window.speechSynthesis.getVoices().length > 0) set({ status: "missing", name: null });
  };
  update();
  window.speechSynthesis.addEventListener("voiceschanged", update);
  // Some browsers never fire voiceschanged when there are no voices at all.
  window.setTimeout(() => {
    if (state.status === "loading") set({ status: "missing", name: null });
  }, 2500);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

/** Whether a Czech voice is available on this device. */
export function useCzechVoice(): VoiceState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
