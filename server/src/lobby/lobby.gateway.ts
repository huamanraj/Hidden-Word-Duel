import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LobbyService } from './lobby.service';
import { JoinLobbyDto, LeaveLobbyDto } from './dto/join-lobby.dto';

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000' },
})
export class LobbyGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(LobbyGateway.name);
  @WebSocketServer() server!: Server;

  constructor(private readonly lobby: LobbyService) {}

  handleDisconnect(client: Socket) {
    this.lobby.dequeueBySocket(client.id);
  }

  @SubscribeMessage('joinLobby')
  async onJoinLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinLobbyDto,
  ) {
    const player = await this.lobby.upsertPlayer(body.username);
    client.data.playerId = player.id;
    client.emit('lobbyJoined', { playerId: player.id, username: player.username });

    const pair = await this.lobby.enqueue({
      socketId: client.id,
      playerId: player.id,
      username: player.username,
    });
    if (!pair) return;

    this.server.to(pair.a.socketId).emit('matchFound', {
      matchId: pair.matchId,
      playerId: pair.a.playerId,
      opponentUsername: pair.a.opponentUsername,
    });
    this.server.to(pair.b.socketId).emit('matchFound', {
      matchId: pair.matchId,
      playerId: pair.b.playerId,
      opponentUsername: pair.b.opponentUsername,
    });
  }

  @SubscribeMessage('leaveLobby')
  onLeaveLobby(@MessageBody() body: LeaveLobbyDto) {
    this.lobby.dequeue(body.playerId);
  }
}
