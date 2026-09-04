import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString() @IsNotEmpty() sessionId: string;
  @IsString() @IsNotEmpty() message: string;
  @IsOptional() @IsInt() conversationId?: number;
  // Un identificador desconocido no rompe nada: resolveShortcut devuelve null
  // y el turno sigue como texto libre.
  @IsOptional() @IsString() shortcutId?: string;
}
