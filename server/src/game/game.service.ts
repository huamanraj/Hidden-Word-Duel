import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WordService } from '../word/word.service';
import { ScoreService } from '../score/score.service';
import { RoundService, TickEmitter } from './round.service';
import { GuessService } from './guess.service';
import { GameState } from './types/game-state';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly games = new Map<string, GameState>();
  private emitter: TickEmitter = () => {};
  private readonly roundEndDelayMs: number;
  private readonly disconnectGraceMs: number;
  private readonly maxRounds: number;
  private readonly pointsToWin: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly word: WordService,
    private readonly round: RoundService,
    private readonly guess: GuessService,
    private readonly score: ScoreService,
    config: ConfigService,
  ) {
    this.roundEndDelayMs = Number(config.get('ROUND_END_DELAY_MS') ?? 3000);
    this.disconnectGraceMs = Number(
      config.get('DISCONNECT_GRACE_PERIOD_MS') ?? 10000,
    );
    this.maxRounds = Number(config.get('MAX_ROUNDS') ?? 5);
    this.pointsToWin = Number(config.get('POINTS_TO_WIN') ?? 3);
  }

  setEmitter(emit: TickEmitter) {
    this.emitter = emit;
  }

  getState(matchId: string) {
    return this.games.get(matchId);
  }

  async initMatch(args: {
    matchId: string;
    player1Id: string;
    player2Id: string;
    username1: string;
    username2: string;
  }) {
    const state: GameState = {
      matchId: args.matchId,
      player1Id: args.player1Id,
      player2Id: args.player2Id,
      usernames: {
        [args.player1Id]: args.username1,
        [args.player2Id]: args.username2,
      },
      sockets: new Map(),
      currentRound: null,
      score1: 0,
      score2: 0,
      roundNumber: 0,
      disconnectTimers: new Map(),
      ended: false,
    };
    this.games.set(args.matchId, state);
  }

  attachSocket(matchId: string, playerId: string, socketId: string) {
    const state = this.games.get(matchId);
    if (!state) return;
    state.sockets.set(playerId, socketId);
    const pending = state.disconnectTimers.get(playerId);
    if (pending) {
      clearTimeout(pending);
      state.disconnectTimers.delete(playerId);
    }
  }

  opponentOf(state: GameState, playerId: string) {
    return state.player1Id === playerId ? state.player2Id : state.player1Id;
  }

  async startNextRound(matchId: string) {
    const state = this.games.get(matchId);
    if (!state || state.ended) return;
    state.roundNumber += 1;
    const word = this.word.getRandomWord();
    const dbRound = await this.prisma.round.create({
      data: {
        matchId,
        word,
        revealedTiles: new Array(word.length).fill(false) as boolean[],
        roundNumber: state.roundNumber,
      },
    });
    state.currentRound = this.round.createRound(dbRound.id, word);
    this.emitter(matchId, 'startRound', {
      roundId: dbRound.id,
      wordLength: word.length,
      roundNumber: state.roundNumber,
      totalRounds: this.maxRounds,
    });
    this.round.startTick(state, this.emitter, () =>
      this.onTickExpire(matchId),
    );
  }

  private async onTickExpire(matchId: string) {
    const state = this.games.get(matchId);
    if (!state?.currentRound) return;
    const { allRevealed } = this.round.revealNextTile(state, this.emitter);
    if (allRevealed) {
      await this.endRound(matchId, null);
      return;
    }
    this.round.startTick(state, this.emitter, () =>
      this.onTickExpire(matchId),
    );
  }

  async handleGuess(args: {
    matchId: string;
    playerId: string;
    roundId: string;
    guessText: string;
  }): Promise<{ error?: { code: string; message: string } }> {
    const state = this.games.get(args.matchId);
    if (!state?.currentRound)
      return { error: { code: 'NO_ACTIVE_ROUND', message: 'No active round' } };
    const round = state.currentRound;
    if (round.roundId !== args.roundId)
      return { error: { code: 'STALE_ROUND', message: 'Round mismatch' } };
    if (!round.tickActive)
      return {
        error: { code: 'LATE_SUBMISSION', message: 'Tick ended' },
      };
    if (round.guessThisTick.has(args.playerId))
      return {
        error: { code: 'ALREADY_GUESSED', message: 'One guess per tick' },
      };
    if (!this.guess.validate(args.guessText, round.word.length))
      return {
        error: { code: 'INVALID_GUESS', message: 'Bad length or characters' },
      };

    round.guessThisTick.set(args.playerId, args.guessText);
    const correct = this.guess.isCorrect(args.guessText, round.word);
    void this.guess.record({
      roundId: round.roundId,
      playerId: args.playerId,
      guess: args.guessText,
      isCorrect: correct,
    });
    this.emitter(args.matchId, 'guessResult', {
      playerId: args.playerId,
      isCorrect: correct,
    });

    if (correct) {
      round.correctThisTick.add(args.playerId);
      const both =
        round.correctThisTick.has(state.player1Id) &&
        round.correctThisTick.has(state.player2Id);
      if (both) {
        await this.endRound(args.matchId, null);
      } else {
        await this.endRound(args.matchId, args.playerId);
      }
    }
    return {};
  }

  private async endRound(matchId: string, winnerId: string | null) {
    const state = this.games.get(matchId);
    if (!state?.currentRound) return;
    this.round.stopTick(state);
    if (winnerId === state.player1Id) state.score1 += 1;
    else if (winnerId === state.player2Id) state.score2 += 1;

    const revealed = state.currentRound.word
      .split('')
      .map(() => true);
    await this.score.persistRound({
      matchId,
      roundId: state.currentRound.roundId,
      winnerId,
      score1: state.score1,
      score2: state.score2,
      revealedTiles: state.currentRound.revealedTiles,
    });

    this.emitter(matchId, 'roundEnd', {
      winner: winnerId,
      revealedWord: state.currentRound.word,
      scores: { score1: state.score1, score2: state.score2 },
    });
    void revealed;

    const hitTarget =
      state.score1 >= this.pointsToWin || state.score2 >= this.pointsToWin;
    const outOfRounds = state.roundNumber >= this.maxRounds;
    if (hitTarget || outOfRounds) {
      setTimeout(() => void this.endMatch(matchId), this.roundEndDelayMs);
    } else {
      setTimeout(
        () => void this.startNextRound(matchId),
        this.roundEndDelayMs,
      );
    }
  }

  private async endMatch(matchId: string) {
    const state = this.games.get(matchId);
    if (!state || state.ended) return;
    state.ended = true;
    let winnerId: string | null | 'draw' = null;
    if (state.score1 > state.score2) winnerId = state.player1Id;
    else if (state.score2 > state.score1) winnerId = state.player2Id;
    else winnerId = 'draw';

    await this.score.finalizeMatch({
      matchId,
      winnerId: winnerId === 'draw' ? null : winnerId,
      score1: state.score1,
      score2: state.score2,
    });

    this.emitter(matchId, 'matchEnd', {
      winner: winnerId,
      finalScores: { score1: state.score1, score2: state.score2 },
    });

    setTimeout(() => this.games.delete(matchId), 60_000);
  }

  handleDisconnect(playerId: string, socketId: string) {
    for (const state of this.games.values()) {
      if (state.ended) continue;
      if (state.sockets.get(playerId) !== socketId) continue;
      state.sockets.delete(playerId);
      const opp = this.opponentOf(state, playerId);
      this.emitter(state.matchId, 'opponentDisconnected', {
        playerId,
        graceMs: this.disconnectGraceMs,
      });
      const timer = setTimeout(() => {
        if (!this.games.get(state.matchId) || state.ended) return;
        this.round.stopTick(state);
        if (opp === state.player1Id) state.score1 = this.pointsToWin;
        else state.score2 = this.pointsToWin;
        void this.endMatch(state.matchId);
      }, this.disconnectGraceMs);
      state.disconnectTimers.set(playerId, timer);
    }
  }

  snapshotFor(matchId: string, playerId: string) {
    const state = this.games.get(matchId);
    if (!state) return null;
    const round = state.currentRound;
    const elapsed = round?.tickActive
      ? Math.max(0, Date.now() - round.tickStartedAt)
      : 0;
    const remaining = round?.tickActive
      ? Math.max(0, this.round.tickMs - elapsed)
      : 0;
    return {
      matchId,
      you: playerId,
      opponent: this.opponentOf(state, playerId),
      usernames: state.usernames,
      scores: { score1: state.score1, score2: state.score2 },
      roundNumber: state.roundNumber,
      totalRounds: this.maxRounds,
      round: round
        ? {
            roundId: round.roundId,
            wordLength: round.word.length,
            revealedTiles: this.round.serializeTiles(round),
            tickActive: round.tickActive,
            timeRemaining: remaining,
            alreadyGuessedThisTick: round.guessThisTick.has(playerId),
          }
        : null,
    };
  }
}
