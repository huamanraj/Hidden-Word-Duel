import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameState, RoundState } from './types/game-state';

export type TickEmitter = (
  matchId: string,
  event: string,
  payload: unknown,
) => void;

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);
  private readonly tickIntervalMs: number;

  constructor(private readonly config: ConfigService) {
    this.tickIntervalMs = Number(config.get('TICK_INTERVAL_MS') ?? 5000);
  }

  createRound(roundId: string, word: string): RoundState {
    return {
      roundId,
      word,
      revealedTiles: new Array(word.length).fill(false) as boolean[],
      tickNumber: 0,
      tickTimer: null,
      tickActive: false,
      tickStartedAt: 0,
      guessThisTick: new Map(),
      correctThisTick: new Set(),
    };
  }

  startTick(
    state: GameState,
    emit: TickEmitter,
    onExpire: () => void | Promise<void>,
  ) {
    const round = state.currentRound;
    if (!round) return;
    round.tickNumber += 1;
    round.tickActive = true;
    round.guessThisTick.clear();
    round.correctThisTick.clear();
    round.tickStartedAt = Date.now();

    emit(state.matchId, 'tickStart', {
      tickNumber: round.tickNumber,
      timeRemaining: this.tickIntervalMs,
      revealedTiles: this.serializeTiles(round),
    });

    if (round.tickTimer) clearTimeout(round.tickTimer);
    round.tickTimer = setTimeout(() => {
      round.tickActive = false;
      void onExpire();
    }, this.tickIntervalMs);
  }

  revealNextTile(
    state: GameState,
    emit: TickEmitter,
  ): { allRevealed: boolean } {
    const round = state.currentRound;
    if (!round) return { allRevealed: true };
    const hiddenIdx: number[] = [];
    round.revealedTiles.forEach((r, i) => {
      if (!r) hiddenIdx.push(i);
    });
    if (hiddenIdx.length === 0) return { allRevealed: true };
    const idx = hiddenIdx[Math.floor(Math.random() * hiddenIdx.length)];
    round.revealedTiles[idx] = true;
    emit(state.matchId, 'revealTile', {
      index: idx,
      letter: round.word[idx],
    });
    return { allRevealed: round.revealedTiles.every(Boolean) };
  }

  serializeTiles(round: RoundState): { index: number; letter: string | null }[] {
    return round.revealedTiles.map((revealed, i) => ({
      index: i,
      letter: revealed ? round.word[i] : null,
    }));
  }

  stopTick(state: GameState) {
    const r = state.currentRound;
    if (r?.tickTimer) clearTimeout(r.tickTimer);
    if (r) {
      r.tickTimer = null;
      r.tickActive = false;
    }
  }

  get tickMs() {
    return this.tickIntervalMs;
  }
}
