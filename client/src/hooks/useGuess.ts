"use client";

import { useCallback } from "react";
import { useSocket } from "./useSocket";
import { useGameStore } from "@/store/gameStore";

export function useGuess() {
  const { socket } = useSocket();

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
