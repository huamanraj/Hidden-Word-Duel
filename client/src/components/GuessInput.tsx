"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useGuess } from "@/hooks/useGuess";

export function GuessInput() {
  const wordLength = useGameStore((s) => s.wordLength);
  const locked = useGameStore((s) => s.hasGuessedThisTick);
  const tickActive = useGameStore((s) => s.tickActive);
  const roundId = useGameStore((s) => s.roundId);
  const { submit } = useGuess();
  const [value, setValue] = useState("");

  useEffect(() => setValue(""), [roundId]);

  const disabled = !tickActive || locked || wordLength === 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v.length !== wordLength) return;
    submit(v);
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 w-full">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^a-zA-Z]/g, ""))}
        maxLength={wordLength || 10}
        placeholder={wordLength ? `${wordLength} letters` : "…"}
        disabled={disabled}
        className={[
          "flex-1 px-3 py-2 border-2 font-mono uppercase text-lg tracking-[0.2em]",
          "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)]",
          "outline-none focus:border-[color:var(--ring)]",
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length !== wordLength}
        className={[
          "px-4 py-2 border-2 font-mono uppercase text-sm",
          "border-[color:var(--border)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "hover:brightness-105 active:translate-y-[1px]",
        ].join(" ")}
      >
        Guess
      </button>
    </form>
  );
}
