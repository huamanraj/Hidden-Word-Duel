import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuessService {
  constructor(private readonly prisma: PrismaService) {}

  validate(guessText: string, wordLength: number): boolean {
    const t = guessText.trim();
    return t.length === wordLength && /^[a-zA-Z]+$/.test(t);
  }

  isCorrect(guessText: string, word: string): boolean {
    return guessText.trim().toLowerCase() === word.toLowerCase();
  }

  async record(args: {
    roundId: string;
    playerId: string;
    guess: string;
    isCorrect: boolean;
  }) {
    try {
      await this.prisma.guess.create({ data: args });
    } catch {
      // Non-blocking; audit loss acceptable.
    }
  }
}
