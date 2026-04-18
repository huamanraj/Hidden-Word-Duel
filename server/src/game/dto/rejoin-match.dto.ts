import { IsString, IsNotEmpty } from 'class-validator';

export class RejoinMatchDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  matchId!: string;
}
