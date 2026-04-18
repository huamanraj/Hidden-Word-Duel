"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "./useSocket";
import { useGameStore, SnapshotPayload } from "@/store/gameStore";

export function useGame(matchId: string) {
  const { socket, connected } = useSocket();
  const router = useRouter();
  const joined = useRef(false);

  useEffect(() => {
    if (!socket || !connected) return;
    const playerId = useGameStore.getState().playerId;
    if (!playerId) return;

    const onSnapshot = (snap: SnapshotPayload) => {
      useGameStore.getState().applySnapshot(snap);
      useGameStore.getState().setIsPlayer1(snap.you === Object.keys(snap.usernames)[0]);
    };
    const onStartRound = (p: {
      roundId: string;
      wordLength: number;
      roundNumber: number;
      totalRounds: number;
    }) => useGameStore.getState().startRound(p);
    const onTickStart = (p: {
      tickNumber: number;
      timeRemaining: number;
      revealedTiles: { index: number; letter: string | null }[];
    }) => useGameStore.getState().tickStart(p);
    const onRevealTile = (p: { index: number; letter: string }) =>
      useGameStore.getState().revealTile(p);
    const onGuessResult = (p: { playerId: string; isCorrect: boolean }) => {
      if (p.playerId === useGameStore.getState().playerId && !p.isCorrect) {
        useGameStore.getState().guessLocked();
      }
    };
    const onRoundEnd = (p: {
      winner: string | null;
      revealedWord: string;
      scores: { score1: number; score2: number };
    }) => useGameStore.getState().setRoundResult(p);
    const onMatchEnd = (p: {
      winner: string | "draw" | null;
      finalScores: { score1: number; score2: number };
    }) => {
      useGameStore.getState().setMatchResult(p);
      setTimeout(() => router.push(`/result/${matchId}`), 1500);
    };
    const onOpponentDisc = (p: { graceMs: number }) =>
      useGameStore.getState().setOpponentDisconnected(p.graceMs);
    const onError = (e: { code: string; message: string }) =>
      useGameStore.getState().setError(e);

    socket.on("matchSnapshot", onSnapshot);
    socket.on("startRound", onStartRound);
    socket.on("tickStart", onTickStart);
    socket.on("revealTile", onRevealTile);
    socket.on("guessResult", onGuessResult);
    socket.on("roundEnd", onRoundEnd);
    socket.on("matchEnd", onMatchEnd);
    socket.on("opponentDisconnected", onOpponentDisc);
    socket.on("error", onError);

    if (!joined.current) {
      joined.current = true;
      socket.emit("joinMatch", { matchId, playerId });
    }

    return () => {
      socket.off("matchSnapshot", onSnapshot);
      socket.off("startRound", onStartRound);
      socket.off("tickStart", onTickStart);
      socket.off("revealTile", onRevealTile);
      socket.off("guessResult", onGuessResult);
      socket.off("roundEnd", onRoundEnd);
      socket.off("matchEnd", onMatchEnd);
      socket.off("opponentDisconnected", onOpponentDisc);
      socket.off("error", onError);
    };
  }, [socket, connected, matchId, router]);
}
