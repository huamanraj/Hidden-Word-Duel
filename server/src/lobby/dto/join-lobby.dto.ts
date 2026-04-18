import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class JoinLobbyDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  @Matches(/^[a-zA-Z0-9_\-]+$/)
  username!: string;
}

export class LeaveLobbyDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;
}
