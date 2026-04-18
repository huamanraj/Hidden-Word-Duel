import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuessService {
  constructor(private readonly prisma: PrismaService) {}

  // rejects guesses with wrong length or non-alpha characters before hitting game logic
  validate(guessText: string, wordLength: number): boolean {
    const t = guessText.trim();
    return t.length === wordLength && /^[a-zA-Z]+$/.test(t);
  }

  // case-insensitive comparison against the target word
  isCorrect(guessText: string, word: string): boolean {
    return guessText.trim().toLowerCase() === word.toLowerCase();
  }

  // fire-and-forget audit log; failures are intentionally swallowed
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
