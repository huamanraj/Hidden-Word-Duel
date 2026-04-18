import { Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { SubmitGuessDto } from './dto/submit-guess.dto';
import { RejoinMatchDto } from './dto/rejoin-match.dto';

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000' },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(GameGateway.name);
  @WebSocketServer() server!: Server;

  constructor(private readonly game: GameService) {}

  // injects the socket.io broadcast function into game service after the server is ready
  onModuleInit() {
    this.game.setEmitter((matchId, event, payload) => {
      this.server.to(roomOf(matchId)).emit(event, payload);
    });
  }

  afterInit() {
    this.logger.log('GameGateway initialized');
  }

  // delegates disconnect handling to game service which manages forfeit timers
  handleDisconnect(client: Socket) {
    const playerId = client.data?.playerId as string | undefined;
    if (playerId) this.game.handleDisconnect(playerId, client.id);
  }

  // validates the player belongs to the match, then sends a snapshot and starts the first round if needed
  @SubscribeMessage('joinMatch')
  async onJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: RejoinMatchDto,
  ) {
    const state = this.game.getState(body.matchId);
    if (!state) {
      client.emit('error', {
        code: 'MATCH_NOT_FOUND',
        message: 'Match no longer active',
      });
      return;
    }
    const isPlayer =
      state.player1Id === body.playerId || state.player2Id === body.playerId;
    if (!isPlayer) {
      client.emit('error', {
        code: 'NOT_A_PLAYER',
        message: 'You are not in this match',
      });
      return;
    }
    client.data.playerId = body.playerId;
    client.data.matchId = body.matchId;
    await client.join(roomOf(body.matchId));
    this.game.attachSocket(body.matchId, body.playerId, client.id);
    client.emit('matchSnapshot', this.game.snapshotFor(body.matchId, body.playerId));
    if (!state.currentRound) {
      await this.game.startNextRound(body.matchId);
    }
  }

  // forwards the guess to game service which handles all validation and scoring
  @SubscribeMessage('submitGuess')
  async onSubmitGuess(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SubmitGuessDto,
  ) {
    const matchId = client.data?.matchId as string | undefined;
    if (!matchId) {
      client.emit('error', {
        code: 'NO_MATCH',
        message: 'Socket not attached to a match',
      });
      return;
    }
    const result = await this.game.handleGuess({
      matchId,
      playerId: body.playerId,
      roundId: body.roundId,
      guessText: body.guessText,
    });
    if (result.error) client.emit('error', result.error);
  }

  // responds to client heartbeat pings by re-sending the current snapshot
  @SubscribeMessage('pingTick')
  onPingTick(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { matchId: string; playerId: string },
  ) {
    const snap = this.game.snapshotFor(body.matchId, body.playerId);
    if (snap) client.emit('matchSnapshot', snap);
  }
}

// scopes socket.io rooms to individual matches to avoid cross-match broadcasts
function roomOf(matchId: string) {
  return `match:${matchId}`;
}
