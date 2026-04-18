"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "./useSocket";
import { useGameStore } from "@/store/gameStore";

export function useLobby(username: string | null) {
  const { socket, connected } = useSocket();
  const router = useRouter();
  const joined = useRef(false);

  useEffect(() => {
    if (!socket || !connected || !username || joined.current) return;
    joined.current = true;

    const onLobbyJoined = (p: { playerId: string; username: string }) => {
      useGameStore.getState().setIdentity(p);
    };
    const onMatchFound = (p: {
      matchId: string;
      playerId: string;
      opponentUsername: string;
    }) => {
      useGameStore.getState().setIdentity({
        playerId: p.playerId,
        username: username,
      });
      useGameStore.getState().setMatch({
        matchId: p.matchId,
        opponentUsername: p.opponentUsername,
      });
      router.push(`/game/${p.matchId}`);
    };

    socket.on("lobbyJoined", onLobbyJoined);
    socket.on("matchFound", onMatchFound);
    socket.emit("joinLobby", { username });

    return () => {
      socket.off("lobbyJoined", onLobbyJoined);
      socket.off("matchFound", onMatchFound);
    };
  }, [socket, connected, username, router]);

  const leave = () => {
    const playerId = useGameStore.getState().playerId;
    if (socket && playerId) socket.emit("leaveLobby", { playerId });
    joined.current = false;
  };

  return { leave, connected };
}
