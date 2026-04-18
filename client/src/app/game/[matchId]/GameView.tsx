"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/hooks/useGame";
import { useGameStore } from "@/store/gameStore";
import { TileGrid } from "@/components/TileGrid";
import { TickTimer } from "@/components/TickTimer";
import { GuessInput } from "@/components/GuessInput";
import { ScoreBoard } from "@/components/ScoreBoard";
import { RoundResult } from "@/components/RoundResult";
import { OpponentStatus } from "@/components/OpponentStatus";

export function GameView({ matchId }: { matchId: string }) {
  const router = useRouter();
  const playerId = useGameStore((s) => s.playerId);

  useEffect(() => {
    if (!playerId) router.replace("/");
  }, [playerId, router]);

  useGame(matchId);

  return (
    <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <ScoreBoard />
        <OpponentStatus />
        <div className="border-2 border-[color:var(--border)] bg-[color:var(--card)] p-4 sm:p-6 flex flex-col gap-4">
          <TickTimer />
          <TileGrid />
          <GuessInput />
        </div>
        <ErrorBanner />
      </div>
      <RoundResult />
    </main>
  );
}

function ErrorBanner() {
  const err = useGameStore((s) => s.lastError);
  if (!err) return null;
  return (
    <div className="w-full border-2 border-[color:var(--destructive)] bg-[color:var(--card)] text-[color:var(--destructive)] font-mono text-xs p-2 text-center">
      {err.code}: {err.message}
    </div>
  );
}
