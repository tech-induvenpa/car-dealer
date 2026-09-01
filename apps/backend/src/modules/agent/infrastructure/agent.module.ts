import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LeadsModule } from '../../leads/infrastructure/leads.module';
import { ProfileModule } from '../../profile/infrastructure/profile.module';
import { VehiclesModule } from '../../vehicles/infrastructure/vehicles.module';
import { SendMessageHandler } from '../application/commands/send-message.handler';
import { GetActiveConversationHandler } from '../application/queries/get-active-conversation.handler';
import { CONVERSATION_REPOSITORY } from '../domain/ports/conversation.repository';
import { LLM_PORT } from '../domain/ports/llm.port';
import { AgentController } from './agent.controller';
import { KimiLlmAdapter } from './llm/kimi-llm.adapter';
import { OpenAiLlmAdapter } from './llm/openai-llm.adapter';
import { VertexLlmAdapter } from './llm/vertex-llm.adapter';
import { ConversationRepositoryAdapter } from './persistence/conversation.repository.adapter';

// LLM_PROVIDER=kimi|openai|vertex — swap de proveedor sin tocar dominio,
// orquestación ni tests del handler, ese es el punto del puerto hexagonal
// (LlmPort, ver ADR-0011). Kimi es la decisión de producción actual (ver
// memoria de proyecto); openai/vertex quedan disponibles para pruebas.
function llmAdapterProvider() {
  const provider = process.env.LLM_PROVIDER ?? 'kimi';
  if (provider === 'openai') return OpenAiLlmAdapter;
  if (provider === 'vertex') return VertexLlmAdapter;
  return KimiLlmAdapter;
}

@Module({
  imports: [CqrsModule, VehiclesModule, ProfileModule, LeadsModule],
  controllers: [AgentController],
  providers: [
    SendMessageHandler,
    GetActiveConversationHandler,
    { provide: CONVERSATION_REPOSITORY, useClass: ConversationRepositoryAdapter },
    { provide: LLM_PORT, useClass: llmAdapterProvider() },
  ],
})
export class AgentModule {}
