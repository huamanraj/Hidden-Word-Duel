import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus } from '@prisma/client';

@Injectable()
export class ScoreService {
  private readonly logger = new Logger(ScoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async persistRound(args: {
    matchId: string;
    score1: number;
    score2: number;
    roundId: string;
    winnerId: string | null;
    revealedTiles: boolean[];
  }) {
    try {
      await this.prisma.$transaction([
        this.prisma.match.update({
          where: { id: args.matchId },
          data: { score1: args.score1, score2: args.score2 },
        }),
        this.prisma.round.update({
          where: { id: args.roundId },
          data: {
            winnerId: args.winnerId ?? undefined,
            endedAt: new Date(),
            revealedTiles: args.revealedTiles,
          },
        }),
      ]);
    } catch (e) {
      // Keep in-memory truth; retry once after 1s.
      this.logger.error('persistRound failed, retrying', e);
      setTimeout(() => {
        void this.persistRoundRetry(args);
      }, 1000);
    }
  }

  private async persistRoundRetry(args: {
    matchId: string;
    score1: number;
    score2: number;
    roundId: string;
    winnerId: string | null;
    revealedTiles: boolean[];
  }) {
    try {
      await this.prisma.$transaction([
        this.prisma.match.update({
          where: { id: args.matchId },
          data: { score1: args.score1, score2: args.score2 },
        }),
        this.prisma.round.update({
          where: { id: args.roundId },
          data: {
            winnerId: args.winnerId ?? undefined,
            endedAt: new Date(),
            revealedTiles: args.revealedTiles,
          },
        }),
      ]);
    } catch (e) {
      this.logger.error('persistRound retry failed', e);
    }
  }

  async finalizeMatch(args: {
    matchId: string;
    winnerId: string | null;
    score1: number;
    score2: number;
  }) {
    try {
      await this.prisma.match.update({
        where: { id: args.matchId },
        data: {
          status: MatchStatus.COMPLETED,
          winnerId: args.winnerId ?? undefined,
          score1: args.score1,
          score2: args.score2,
        },
      });
      if (args.winnerId) {
        await this.prisma.player.update({
          where: { id: args.winnerId },
          data: { totalWins: { increment: 1 } },
        });
      }
    } catch (e) {
      this.logger.error('finalizeMatch failed', e);
    }
  }
}
