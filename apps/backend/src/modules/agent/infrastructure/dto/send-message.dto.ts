import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString() @IsNotEmpty() sessionId: string;
  @IsString() @IsNotEmpty() message: string;
}
