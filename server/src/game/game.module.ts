import { Module } from '@nestjs/common';
import { WordModule } from '../word/word.module';
import { ScoreModule } from '../score/score.module';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { RoundService } from './round.service';
import { GuessService } from './guess.service';

@Module({
  imports: [WordModule, ScoreModule],
  providers: [GameGateway, GameService, RoundService, GuessService],
  exports: [GameService],
})
export class GameModule {}
