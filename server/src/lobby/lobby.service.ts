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

  // creates the player row on first join or returns the existing one
  async upsertPlayer(username: string) {
    return this.prisma.player.upsert({
      where: { username },
      update: {},
      create: { username },
    });
  }

  // adds the player to the queue and immediately pairs when two are waiting
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

  // removes a player from the queue by their player id
  dequeue(playerId: string) {
    this.queue = this.queue.filter((e) => e.playerId !== playerId);
  }

  // removes a player from the queue by their socket id, used when they disconnect before matching
  dequeueBySocket(socketId: string) {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }

  // persists the match row and initialises in-memory game state for the paired players
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

  // returns current queue length for debug visibility
  size() {
    return this.queue.length;
  }
}
