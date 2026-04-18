"use client";

export function LobbyWaiting({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-[color:var(--primary)] animate-pulse" />
        <span className="w-3 h-3 bg-[color:var(--primary)] animate-pulse [animation-delay:150ms]" />
        <span className="w-3 h-3 bg-[color:var(--primary)] animate-pulse [animation-delay:300ms]" />
      </div>
      <h1 className="font-mono text-2xl sm:text-3xl">Searching for opponent…</h1>
      <p className="text-[color:var(--muted-foreground)] font-mono">
        Playing as <span className="text-[color:var(--foreground)]">{username}</span>
      </p>
    </div>
  );
}
