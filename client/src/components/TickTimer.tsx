"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";

export function TickTimer() {
  const tickEndsAt = useGameStore((s) => s.tickEndsAt);
  const duration = useGameStore((s) => s.tickDurationMs);
  const active = useGameStore((s) => s.tickActive);
  const [pct, setPct] = useState(100);

  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }
    let raf = 0;
    const loop = () => {
      const remaining = Math.max(0, tickEndsAt - Date.now());
      setPct(Math.max(0, Math.min(100, (remaining / duration) * 100)));
      if (remaining > 0) raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [tickEndsAt, duration, active]);

  const color =
    pct > 60
      ? "var(--secondary)"
      : pct > 25
      ? "var(--accent)"
      : "var(--destructive)";

  return (
    <div className="w-full h-3 border-2 border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
      <div
        className="h-full transition-[width] duration-100"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
