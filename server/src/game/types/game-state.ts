export interface RoundState {
  roundId: string;
  word: string;
  revealedTiles: boolean[];
  tickNumber: number;
  tickTimer: NodeJS.Timeout | null;
  tickActive: boolean;
  tickStartedAt: number;
  guessThisTick: Map<string, string>;
  correctThisTick: Set<string>;
}

export interface GameState {
  matchId: string;
  player1Id: string;
  player2Id: string;
  usernames: Record<string, string>;
  sockets: Map<string, string>;
  currentRound: RoundState | null;
  score1: number;
  score2: number;
  roundNumber: number;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  ended: boolean;
}
