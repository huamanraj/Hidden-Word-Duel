import { Module } from '@nestjs/common';
import { GameModule } from '../game/game.module';
import { LobbyGateway } from './lobby.gateway';
import { LobbyService } from './lobby.service';

@Module({
  imports: [GameModule],
  providers: [LobbyGateway, LobbyService],
})
export class LobbyModule {}
