"use client";

import { useGameStore } from "@/store/gameStore";

export function ScoreBoard() {
  const username = useGameStore((s) => s.username);
  const opponentUsername = useGameStore((s) => s.opponentUsername);
  const score1 = useGameStore((s) => s.scores.score1);
  const score2 = useGameStore((s) => s.scores.score2);
  const isPlayer1 = useGameStore((s) => s.isPlayer1);
  const roundNumber = useGameStore((s) => s.roundNumber);
  const totalRounds = useGameStore((s) => s.totalRounds);

  const myScore = isPlayer1 ? score1 : score2;
  const oppScore = isPlayer1 ? score2 : score1;
  const leader =
    myScore === oppScore ? "tie" : myScore > oppScore ? "me" : "opp";

  return (
    <div className="w-full flex items-stretch justify-between gap-3 border-2 border-[color:var(--border)] bg-[color:var(--card)] p-3">
      <PlayerCell name={username ?? "You"} score={myScore} lead={leader === "me"} />
      <div className="flex flex-col items-center justify-center min-w-[80px]">
        <div className="text-xs text-[color:var(--muted-foreground)] font-mono">ROUND</div>
        <div className="font-mono text-lg">
          {roundNumber || "-"} / {totalRounds}
        </div>
      </div>
      <PlayerCell
        name={opponentUsername ?? "Opponent"}
        score={oppScore}
        lead={leader === "opp"}
        align="right"
      />
    </div>
  );
}

function PlayerCell({
  name,
  score,
  lead,
  align = "left",
}: {
  name: string;
  score: number;
  lead: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex-1 flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <div
        className={[
          "font-mono text-sm truncate max-w-full",
          lead ? "text-[color:var(--foreground)] font-bold" : "text-[color:var(--muted-foreground)]",
        ].join(" ")}
      >
        {name}
      </div>
      <div
        className={[
          "font-mono text-3xl leading-none",
          lead ? "text-[color:var(--primary)]" : "text-[color:var(--foreground)]",
        ].join(" ")}
      >
        {score}
      </div>
    </div>
  );
}
