"use client";

/**
 * Browser-side progress store backed by localStorage. Components subscribe with
 * `useProgress()`; cloud sync listens to the same store
 * (components/progress-sync.tsx).
 */
import { useSyncExternalStore } from "react";
import { emptyProgress, markWordsPlayed, parseProgress, recordGame, type GameRecord, type Progress } from "@/lib/progress";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";

const KEY = "cp:progress:v1";
const SERVER_SNAPSHOT = emptyProgress();

let current: Progress | null = null;
const listeners = new Set<() => void>();

function load(): Progress {
  if (current) return current;
  current = parseProgress(readJSON<unknown>(KEY, null)) ?? emptyProgress();
  return current;
}

function emit() {
  listeners.forEach((l) => l());
}

export const progressStore = {
  get: load,
  set(next: Progress) {
    current = next;
    writeJSON(KEY, next);
    emit();
  },
  record(rec: GameRecord) {
    const result = recordGame(load(), rec);
    progressStore.set(result.progress);
    return result.bests;
  },
  /** Records matched words for the deck progress bars. */
  markWords(deckId: string, wordIds: string[]) {
    const before = load();
    const next = markWordsPlayed(before, deckId, wordIds);
    if (next !== before) progressStore.set(next);
  },
  reset() {
    current = emptyProgress();
    removeKey(KEY);
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    // Keep tabs in sync with each other.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        current = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};

/** Current progress. Renders the empty state on the server and during hydration. */
export function useProgress(): Progress {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get, () => SERVER_SNAPSHOT);
}

/** True once the component runs in the browser with real progress loaded. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
