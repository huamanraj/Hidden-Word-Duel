"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLobby } from "@/hooks/useLobby";
import { LobbyWaiting } from "@/components/LobbyWaiting";

export default function LobbyPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const u = sessionStorage.getItem("hwd.username");
    if (!u) {
      router.replace("/");
      return;
    }
    setUsername(u);
  }, [router]);

  const { leave, connected } = useLobby(username);

  if (!username) return null;

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8 border-2 border-[color:var(--border)] bg-[color:var(--card)] p-8">
        <LobbyWaiting username={username} />
        <div className="font-mono text-xs text-[color:var(--muted-foreground)]">
          {connected ? "connected to server" : "connecting…"}
        </div>
        <button
          onClick={() => {
            leave();
            router.push("/");
          }}
          className="px-4 py-2 border-2 border-[color:var(--border)] bg-[color:var(--card)] font-mono uppercase text-sm"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}
