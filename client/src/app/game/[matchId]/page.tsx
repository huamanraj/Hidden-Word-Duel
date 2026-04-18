import { GameView } from "./GameView";

export default async function GamePage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <GameView matchId={matchId} />;
}
