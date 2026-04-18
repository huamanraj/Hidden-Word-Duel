"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";

export function OpponentStatus() {
  const connected = useGameStore((s) => s.opponentConnected);
  const graceEnd = useGameStore((s) => s.disconnectGraceEndsAt);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (connected || !graceEnd) return;
    const id = setInterval(() => {
      setRemaining(Math.max(0, graceEnd - Date.now()));
    }, 200);
    return () => clearInterval(id);
  }, [connected, graceEnd]);

  if (connected) return null;

  return (
    <div className="w-full border-2 border-[color:var(--destructive)] bg-[color:var(--card)] text-[color:var(--destructive)] font-mono text-xs p-2 text-center">
      Opponent disconnected — grace {Math.ceil(remaining / 1000)}s
    </div>
  );
}
