"use client";

import { create } from "zustand";

export interface TileState {
  letter: string | null;
}

interface GameStore {
  playerId: string | null;
  username: string | null;
  opponentUsername: string | null;
  matchId: string | null;
  roundId: string | null;
  wordLength: number;
  revealedTiles: TileState[];
  scores: { score1: number; score2: number };
  isPlayer1: boolean;
  tickActive: boolean;
  hasGuessedThisTick: boolean;
  tickDurationMs: number;
  tickEndsAt: number;
  tickNumber: number;
  roundNumber: number;
  totalRounds: number;
  opponentConnected: boolean;
  disconnectGraceEndsAt: number | null;
  lastError: { code: string; message: string } | null;
  roundResult: {
    winner: string | null;
    revealedWord: string;
    scores: { score1: number; score2: number };
  } | null;
  matchResult: {
    winner: string | "draw" | null;
    finalScores: { score1: number; score2: number };
  } | null;
  setIdentity: (p: { playerId: string; username: string }) => void;
  setMatch: (p: {
    matchId: string;
    opponentUsername: string;
  }) => void;
  setIsPlayer1: (v: boolean) => void;
  startRound: (p: {
    roundId: string;
    wordLength: number;
    roundNumber: number;
    totalRounds: number;
  }) => void;
  tickStart: (p: {
    tickNumber: number;
    timeRemaining: number;
    revealedTiles: { index: number; letter: string | null }[];
  }) => void;
  revealTile: (p: { index: number; letter: string }) => void;
  guessLocked: () => void;
  setRoundResult: (p: GameStore["roundResult"]) => void;
  setMatchResult: (p: GameStore["matchResult"]) => void;
  setOpponentDisconnected: (graceMs: number) => void;
  setOpponentReconnected: () => void;
  setError: (e: GameStore["lastError"]) => void;
  clearRoundResult: () => void;
  applySnapshot: (snap: SnapshotPayload) => void;
  reset: () => void;
}

export interface SnapshotPayload {
  matchId: string;
  you: string;
  opponent: string;
  usernames: Record<string, string>;
  scores: { score1: number; score2: number };
  roundNumber: number;
  totalRounds: number;
  round: {
    roundId: string;
    wordLength: number;
    revealedTiles: { index: number; letter: string | null }[];
    tickActive: boolean;
    timeRemaining: number;
    alreadyGuessedThisTick: boolean;
  } | null;
}

const initial = {
  playerId: null,
  username: null,
  opponentUsername: null,
  matchId: null,
  roundId: null,
  wordLength: 0,
  revealedTiles: [] as TileState[],
  scores: { score1: 0, score2: 0 },
  isPlayer1: true,
  tickActive: false,
  hasGuessedThisTick: false,
  tickDurationMs: 5000,
  tickEndsAt: 0,
  tickNumber: 0,
  roundNumber: 0,
  totalRounds: 5,
  opponentConnected: true,
  disconnectGraceEndsAt: null,
  lastError: null,
  roundResult: null,
  matchResult: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initial,
  // stores local player id and display name after joining lobby
  setIdentity: ({ playerId, username }) => set({ playerId, username }),
  // stores matched opponent info and clears stale round/match results
  setMatch: ({ matchId, opponentUsername }) =>
    set({ matchId, opponentUsername, matchResult: null, roundResult: null }),
  // tracks which seat this client occupies so scores render in correct order
  setIsPlayer1: (v) => set({ isPlayer1: v }),
  // resets tile grid and guess state when the server starts a new round
  startRound: ({ roundId, wordLength, roundNumber, totalRounds }) =>
    set({
      roundId,
      wordLength,
      roundNumber,
      totalRounds,
      revealedTiles: Array.from({ length: wordLength }, () => ({ letter: null })),
      roundResult: null,
      hasGuessedThisTick: false,
    }),
  // opens the guess window and syncs the current revealed tiles from server
  tickStart: ({ tickNumber, timeRemaining, revealedTiles }) =>
    set({
      tickNumber,
      tickActive: true,
      hasGuessedThisTick: false,
      tickDurationMs: timeRemaining,
      tickEndsAt: Date.now() + timeRemaining,
      revealedTiles: revealedTiles.map((t) => ({ letter: t.letter })),
    }),
  // updates a single tile and closes the guess window for this tick
  revealTile: ({ index, letter }) =>
    set((s) => {
      const next = s.revealedTiles.slice();
      next[index] = { letter };
      return { revealedTiles: next, tickActive: false };
    }),
  // prevents further guesses after the player has submitted one this tick
  guessLocked: () => set({ hasGuessedThisTick: true }),
  // stores round outcome and disables the guess input until next round
  setRoundResult: (r) => set({ roundResult: r, tickActive: false }),
  // stores final match outcome and disables the guess input
  setMatchResult: (r) => set({ matchResult: r, tickActive: false }),
  // records opponent drop and the deadline before they forfeit
  setOpponentDisconnected: (graceMs) =>
    set({
      opponentConnected: false,
      disconnectGraceEndsAt: Date.now() + graceMs,
    }),
  // clears the disconnect banner when the opponent reconnects in time
  setOpponentReconnected: () =>
    set({ opponentConnected: true, disconnectGraceEndsAt: null }),
  // surfaces server-sent error codes to the ui
  setError: (e) => set({ lastError: e }),
  // hides the round result overlay so the next round can render cleanly
  clearRoundResult: () => set({ roundResult: null }),
  // replaces the full local state with a server-authoritative snapshot on rejoin
  applySnapshot: (snap) =>
    set(() => {
      const tiles: TileState[] = snap.round
        ? snap.round.revealedTiles.map((t) => ({ letter: t.letter }))
        : [];
      return {
        matchId: snap.matchId,
        opponentUsername: snap.usernames[snap.opponent] ?? null,
        scores: snap.scores,
        roundNumber: snap.roundNumber,
        totalRounds: snap.totalRounds,
        roundId: snap.round?.roundId ?? null,
        wordLength: snap.round?.wordLength ?? 0,
        revealedTiles: tiles,
        tickActive: snap.round?.tickActive ?? false,
        hasGuessedThisTick: snap.round?.alreadyGuessedThisTick ?? false,
        tickEndsAt: snap.round?.tickActive
          ? Date.now() + snap.round.timeRemaining
          : 0,
        tickDurationMs: snap.round?.timeRemaining || 5000,
      };
    }),
  // wipes all game state when navigating away from a match
  reset: () => set({ ...initial }),
}));
