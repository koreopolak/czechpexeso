"use client";

/**
 * Cloud sync for signed-in players (Google or email; optionally Premium only,
 * see FEATURES.syncForEveryone). On load: fetch the cloud copy, merge it with this
 * device, save both. After that: push changes a couple of seconds after each
 * finished game. The server merges too, so two devices never overwrite each
 * other. Players who aren't signed in never call the API.
 */
import { useEffect, useSyncExternalStore } from "react";
import { useEntitlement } from "@/components/providers";
import { FEATURES } from "@/lib/config";
import { mergeProgress, parseProgress, type Progress } from "@/lib/progress";
import { progressStore } from "@/lib/progress-store";

export type SyncStatus = "off" | "syncing" | "synced" | "error";

let status: SyncStatus = "off";
const listeners = new Set<() => void>();
function setStatus(s: SyncStatus) {
  status = s;
  listeners.forEach((l) => l());
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => "off" as SyncStatus,
  );
}

async function push(progress: Progress): Promise<Progress | null> {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
  });
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
  return parseProgress(await res.json());
}

export function ProgressSync() {
  const { user, premium, authEnabled } = useEntitlement();
  const enabled = authEnabled && !!user && (premium || FEATURES.syncForEveryone);

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    let lastPushed = 0;

    const sync = async () => {
      setStatus("syncing");
      try {
        const merged = await push(progressStore.get());
        if (cancelled) return;
        if (merged) {
          lastPushed = merged.updatedAt;
          progressStore.set(mergeProgress(progressStore.get(), merged));
        }
        setStatus("synced");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    void sync();
    const unsubscribe = progressStore.subscribe(() => {
      if (progressStore.get().updatedAt <= lastPushed) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(sync, 2000);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [enabled]);

  return null;
}
