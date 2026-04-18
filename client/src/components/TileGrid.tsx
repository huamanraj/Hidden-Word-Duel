"use client";

import { useGameStore } from "@/store/gameStore";

export function TileGrid() {
  const tiles = useGameStore((s) => s.revealedTiles);
  if (tiles.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-muted-foreground">
        Waiting for round to start…
      </div>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 my-6">
      {tiles.map((t, i) => (
        <Tile key={i} letter={t.letter} index={i} />
      ))}
    </div>
  );
}

function Tile({ letter, index }: { letter: string | null; index: number }) {
  const revealed = letter !== null;
  return (
    <div
      key={`${index}-${letter ?? "_"}`}
      className={[
        "w-12 h-14 sm:w-14 sm:h-16",
        "flex items-center justify-center",
        "border-2 border-[color:var(--border)] bg-[color:var(--card)]",
        "font-mono text-2xl sm:text-3xl uppercase select-none",
        revealed ? "tile-flip text-[color:var(--foreground)]" : "animate-pulse text-[color:var(--muted-foreground)]",
      ].join(" ")}
      style={{ boxShadow: "0 1px 0 0 rgba(0,0,0,0.83)" }}
    >
      {revealed ? letter : "_"}
    </div>
  );
}
