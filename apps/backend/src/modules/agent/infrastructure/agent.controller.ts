import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Conversation as ConversationRow } from '@prisma/client';
import { SendMessageCommand } from '../application/commands/send-message.command';
import { StartNewConversationCommand } from '../application/commands/start-new-conversation.command';
import { SendMessageResult } from '../application/commands/send-message.handler';
import { GetActiveConversationQuery } from '../application/queries/get-active-conversation.query';
import { SendMessageDto } from './dto/send-message.dto';
import { StartNewConversationDto } from './dto/start-new-conversation.dto';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Con la conversación como home, el límite global de 5/min bloquearía al
  // comprador en el sexto mensaje — una conversación real son decenas de
  // turnos. Este endpoint tiene su propio límite, más alto pero acotado:
  // sigue siendo la puerta de entrada y cada turno cuesta una llamada al
  // proveedor de IA (ver la nota de costo por visitante en CEB-78).
  @Post('messages')
  @Throttle({ default: { ttl: 60000, limit: Number(process.env.AGENT_THROTTLE_LIMIT ?? 40) } })
  @UseGuards(ThrottlerGuard)
  async sendMessage(@Body() dto: SendMessageDto): Promise<SendMessageResult> {
    return this.commandBus.execute<SendMessageCommand, SendMessageResult>(
      new SendMessageCommand(dto.sessionId, dto.message, dto.conversationId, dto.shortcutId),
    );
  }

  // Empezar de nuevo es un acto explícito con efecto en el servidor: abandona
  // la Conversación ACTIVA y hace que el Agente olvide lo declarado. Sin esto
  // el hilo nuevo arrancaba sabiendo lo del anterior.
  @Post('conversations/new')
  @UseGuards(ThrottlerGuard)
  async startNewConversation(@Body() dto: StartNewConversationDto): Promise<void> {
    await this.commandBus.execute(new StartNewConversationCommand(dto.sessionId));
  }

  // CEB-36-UI-02: anónimo a propósito, mismo criterio que GET /profile/by-session/:sessionId
  @Get('conversations/active/:sessionId')
  @UseGuards(ThrottlerGuard)
  async getActiveConversation(@Param('sessionId') sessionId: string): Promise<ConversationRow | null> {
    return this.queryBus.execute(new GetActiveConversationQuery(sessionId));
  }
}
