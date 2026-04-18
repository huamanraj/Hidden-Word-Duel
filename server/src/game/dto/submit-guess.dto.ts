import { IsString, IsNumber, IsNotEmpty, Length } from 'class-validator';

export class SubmitGuessDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  roundId!: string;

  @IsString()
  @Length(1, 32)
  guessText!: string;

  @IsNumber()
  timestamp!: number;
}
