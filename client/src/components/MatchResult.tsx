"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useGameStore } from "@/store/gameStore";

export function MatchResult() {
  const result = useGameStore((s) => s.matchResult);
  const me = useGameStore((s) => s.playerId);
  const isPlayer1 = useGameStore((s) => s.isPlayer1);

  useEffect(() => {
    if (result?.winner && result.winner !== "draw" && result.winner === me) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [result, me]);

  if (!result) {
    return (
      <div className="text-center font-mono text-[color:var(--muted-foreground)]">
        Loading result…
      </div>
    );
  }

  const isDraw = result.winner === "draw";
  const youWon = result.winner === me;
  const myScore = isPlayer1 ? result.finalScores.score1 : result.finalScores.score2;
  const oppScore = isPlayer1 ? result.finalScores.score2 : result.finalScores.score1;

  const title = isDraw ? "Draw" : youWon ? "Victory" : "Defeat";
  const titleColor = isDraw
    ? "text-[color:var(--foreground)]"
    : youWon
    ? "text-[color:var(--success)]"
    : "text-[color:var(--destructive)]";

  return (
    <div
      className={[
        "w-full flex flex-col items-center gap-6 p-8 border-2 border-[color:var(--border)]",
        "bg-[color:var(--card)]",
        !isDraw && !youWon ? "grayscale opacity-80" : "",
      ].join(" ")}
    >
      <h1 className={`font-mono text-5xl sm:text-6xl uppercase ${titleColor}`}>
        {title}
      </h1>
      <div className="font-mono text-2xl">
        {myScore} — {oppScore}
      </div>
      <Link
        href="/"
        className="px-4 py-2 border-2 border-[color:var(--border)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-mono uppercase text-sm"
      >
        Play Again
      </Link>
    </div>
  );
}
