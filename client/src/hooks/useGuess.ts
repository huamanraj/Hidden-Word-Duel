"use client";

import { useCallback } from "react";
import { useSocket } from "./useSocket";
import { useGameStore } from "@/store/gameStore";

// exposes a submit function that validates state then emits the guess to the server
export function useGuess() {
  const { socket } = useSocket();

  // optimistically locks the guess slot before the server confirms to prevent double-submit
  const submit = useCallback(
    (guessText: string) => {
      const { playerId, roundId, hasGuessedThisTick, tickActive } =
        useGameStore.getState();
      if (!socket || !playerId || !roundId) return;
      if (hasGuessedThisTick || !tickActive) return;
      useGameStore.getState().guessLocked();
      socket.emit("submitGuess", {
        playerId,
        roundId,
        guessText,
        timestamp: Date.now(),
      });
    },
    [socket],
  );

  return { submit };
}
