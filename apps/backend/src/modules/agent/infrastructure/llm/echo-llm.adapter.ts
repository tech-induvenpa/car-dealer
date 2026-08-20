import { Injectable } from '@nestjs/common';
import { LlmPort, LlmReply, LlmReplyContext } from '../../domain/ports/llm.port';

// ponytail: stub deliberado — el adapter real de proveedor (CEB-42) lo
// reemplaza sin tocar SendMessageHandler ni el resto del dominio, esa es
// la frontera hexagonal que existe a propósito.
@Injectable()
export class EchoLlmAdapter implements LlmPort {
  async reply(context: LlmReplyContext): Promise<LlmReply> {
    return { message: `[stub] recibido: ${context.buyerMessage}` };
  }
}
