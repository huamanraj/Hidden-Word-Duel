import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameService } from '../game/game.service';

interface QueueEntry {
  socketId: string;
  playerId: string;
  username: string;
}

@Injectable()
export class LobbyService {
  private readonly logger = new Logger(LobbyService.name);
  private queue: QueueEntry[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly game: GameService,
  ) {}

  async upsertPlayer(username: string) {
    return this.prisma.player.upsert({
      where: { username },
      update: {},
      create: { username },
    });
  }

  async enqueue(entry: QueueEntry) {
    this.queue = this.queue.filter((e) => e.playerId !== entry.playerId);
    this.queue.push(entry);
    if (this.queue.length >= 2) {
      const a = this.queue.shift()!;
      const b = this.queue.shift()!;
      return this.pair(a, b);
    }
    return null;
  }

  dequeue(playerId: string) {
    this.queue = this.queue.filter((e) => e.playerId !== playerId);
  }

  dequeueBySocket(socketId: string) {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }

  private async pair(a: QueueEntry, b: QueueEntry) {
    const match = await this.prisma.match.create({
      data: { player1Id: a.playerId, player2Id: b.playerId },
    });
    await this.game.initMatch({
      matchId: match.id,
      player1Id: a.playerId,
      player2Id: b.playerId,
      username1: a.username,
      username2: b.username,
    });
    return {
      matchId: match.id,
      a: { ...a, opponentUsername: b.username },
      b: { ...b, opponentUsername: a.username },
    };
  }

  size() {
    return this.queue.length;
  }
}
