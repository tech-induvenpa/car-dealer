import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SendMessageCommand } from '../application/commands/send-message.command';
import { SendMessageResult } from '../application/commands/send-message.handler';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('messages')
  @UseGuards(ThrottlerGuard)
  async sendMessage(@Body() dto: SendMessageDto): Promise<SendMessageResult> {
    return this.commandBus.execute<SendMessageCommand, SendMessageResult>(
      new SendMessageCommand(dto.sessionId, dto.message),
    );
  }
}
