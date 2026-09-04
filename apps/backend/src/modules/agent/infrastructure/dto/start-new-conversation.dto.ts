import { IsNotEmpty, IsString } from 'class-validator';

export class StartNewConversationDto {
  @IsString() @IsNotEmpty() sessionId: string;
}
