"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export function RoundResult() {
  const result = useGameStore((s) => s.roundResult);
  const myId = useGameStore((s) => s.playerId);
  const clear = useGameStore((s) => s.clearRoundResult);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => clear(), 2800);
    return () => clearTimeout(t);
  }, [result, clear]);

  if (!result) return null;
  const label =
    result.winner === null
      ? "Round Draw"
      : result.winner === myId
      ? "You won the round!"
      : "Opponent won the round";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="border-2 border-[color:var(--border)] bg-[color:var(--card)] p-6 sm:p-8 text-center max-w-sm w-[90%]">
        <div className="font-mono text-sm text-[color:var(--muted-foreground)] mb-2">
          ROUND OVER
        </div>
        <div className="font-mono text-xl sm:text-2xl mb-3">{label}</div>
        <div className="font-mono text-lg uppercase tracking-[0.3em]">
          {result.revealedWord}
        </div>
        <div className="mt-4 font-mono text-sm text-[color:var(--muted-foreground)]">
          {result.scores.score1} — {result.scores.score2}
        </div>
      </div>
    </div>
  );
}
