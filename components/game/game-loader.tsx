"use client";

import dynamic from "next/dynamic";

/** Placeholder with the same rhythm as the real screen while the game loads. */
function GameSkeleton() {
  return (
    <div className="container-page pt-4" aria-busy="true">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-surface" />
      <div className="mt-4 h-5 w-64 animate-pulse rounded-lg bg-surface" />
      <div className="mx-auto mt-6 grid max-w-xl grid-cols-4 gap-3">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}

/** The board is shuffled randomly, so it only renders in the browser. */
export const GameLoader = dynamic(() => import("@/components/game/game-screen").then((m) => m.GameScreen), {
  ssr: false,
  loading: GameSkeleton,
});
