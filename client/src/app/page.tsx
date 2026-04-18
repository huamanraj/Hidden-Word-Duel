"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const canPlay = /^[a-zA-Z0-9_\-]{2,20}$/.test(username.trim());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlay) return;
    sessionStorage.setItem("hwd.username", username.trim());
    router.push("/lobby");
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md flex flex-col gap-6 border-2 border-[color:var(--border)] bg-[color:var(--card)] p-6 sm:p-8"
      >
        <div>
          <h1 className="font-mono text-3xl sm:text-4xl">Hidden Word Duel</h1>
          <p className="text-[color:var(--muted-foreground)] font-mono text-sm mt-1">
            Guess the hidden word before your opponent.
          </p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-sm">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            placeholder="e.g. player_one"
            className="px-3 py-2 border-2 border-[color:var(--border)] bg-[color:var(--card)] font-mono outline-none focus:border-[color:var(--ring)]"
          />
        </label>
        <button
          type="submit"
          disabled={!canPlay}
          className="w-full py-3 border-2 border-[color:var(--border)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 active:translate-y-[1px]"
        >
          Find Match
        </button>
      </form>
    </main>
  );
}
