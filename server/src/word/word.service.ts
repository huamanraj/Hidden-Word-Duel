import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class WordService implements OnModuleInit {
  private words: string[] = [];

  onModuleInit() {
    const path = join(process.cwd(), 'src', 'assets', 'words.txt');
    const raw = readFileSync(path, 'utf-8');
    this.words = raw
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => /^[a-z]+$/.test(w) && w.length >= 4 && w.length <= 8);
  }

  getRandomWord(): string {
    if (this.words.length === 0) throw new Error('Word list empty');
    return this.words[Math.floor(Math.random() * this.words.length)];
  }
}
