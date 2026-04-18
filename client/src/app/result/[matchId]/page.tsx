import { MatchResult } from "@/components/MatchResult";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  await params;
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <MatchResult />
      </div>
    </main>
  );
}
