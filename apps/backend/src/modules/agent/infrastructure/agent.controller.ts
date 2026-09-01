import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Conversation as ConversationRow } from '@prisma/client';
import { SendMessageCommand } from '../application/commands/send-message.command';
import { SendMessageResult } from '../application/commands/send-message.handler';
import { GetActiveConversationQuery } from '../application/queries/get-active-conversation.query';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('messages')
  @UseGuards(ThrottlerGuard)
  async sendMessage(@Body() dto: SendMessageDto): Promise<SendMessageResult> {
    return this.commandBus.execute<SendMessageCommand, SendMessageResult>(
      new SendMessageCommand(dto.sessionId, dto.message, dto.conversationId),
    );
  }

  // CEB-36-UI-02: anónimo a propósito, mismo criterio que GET /profile/by-session/:sessionId
  @Get('conversations/active/:sessionId')
  @UseGuards(ThrottlerGuard)
  async getActiveConversation(@Param('sessionId') sessionId: string): Promise<ConversationRow | null> {
    return this.queryBus.execute(new GetActiveConversationQuery(sessionId));
  }
}
