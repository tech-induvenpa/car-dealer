import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LeadsModule } from '../../leads/infrastructure/leads.module';
import { ProfileModule } from '../../profile/infrastructure/profile.module';
import { VehiclesModule } from '../../vehicles/infrastructure/vehicles.module';
import { SendMessageHandler } from '../application/commands/send-message.handler';
import { CONVERSATION_REPOSITORY } from '../domain/ports/conversation.repository';
import { LLM_PORT } from '../domain/ports/llm.port';
import { AgentController } from './agent.controller';
import { VertexLlmAdapter } from './llm/vertex-llm.adapter';
import { ConversationRepositoryAdapter } from './persistence/conversation.repository.adapter';

@Module({
  imports: [CqrsModule, VehiclesModule, ProfileModule, LeadsModule],
  controllers: [AgentController],
  providers: [
    SendMessageHandler,
    { provide: CONVERSATION_REPOSITORY, useClass: ConversationRepositoryAdapter },
    // CEB-42: reemplaza al stub EchoLlmAdapter (CEB-38), sin tocar el
    // resto de la orquestación — ese es el punto del puerto hexagonal.
    { provide: LLM_PORT, useClass: VertexLlmAdapter },
  ],
})
export class AgentModule {}
