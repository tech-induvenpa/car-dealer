import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LeadsModule } from '../../leads/infrastructure/leads.module';
import { ProfileModule } from '../../profile/infrastructure/profile.module';
import { VehiclesModule } from '../../vehicles/infrastructure/vehicles.module';
import { SendMessageHandler } from '../application/commands/send-message.handler';
import { StartNewConversationHandler } from '../application/commands/start-new-conversation.handler';
import { GetActiveConversationHandler } from '../application/queries/get-active-conversation.handler';
import { CONVERSATION_REPOSITORY } from '../domain/ports/conversation.repository';
import { LLM_PORT } from '../domain/ports/llm.port';
import { EchoLlmAdapter } from './llm/echo-llm.adapter';
import { AgentController } from './agent.controller';
import { KimiLlmAdapter } from './llm/kimi-llm.adapter';
import { OpenAiLlmAdapter } from './llm/openai-llm.adapter';
import { VertexLlmAdapter } from './llm/vertex-llm.adapter';
import { ConversationRepositoryAdapter } from './persistence/conversation.repository.adapter';

@Module({
  imports: [CqrsModule, VehiclesModule, ProfileModule, LeadsModule],
  controllers: [AgentController],
  providers: [
    SendMessageHandler,
    StartNewConversationHandler,
    GetActiveConversationHandler,
    { provide: CONVERSATION_REPOSITORY, useClass: ConversationRepositoryAdapter },
    KimiLlmAdapter,
    OpenAiLlmAdapter,
    VertexLlmAdapter,
    EchoLlmAdapter,
    // useFactory y no useClass: así LLM_PROVIDER se lee al resolver la
    // dependencia y no al cargar el módulo. Con useClass, cualquiera que
    // quiera fijar el proveedor (un tracer-bullet, un script local) tendría
    // que hacerlo antes del primer import de este archivo, que es una
    // condición imposible de cumplir de forma fiable.
    {
      provide: LLM_PORT,
      inject: [KimiLlmAdapter, OpenAiLlmAdapter, VertexLlmAdapter, EchoLlmAdapter],
      useFactory: (kimi: KimiLlmAdapter, openai: OpenAiLlmAdapter, vertex: VertexLlmAdapter, echo: EchoLlmAdapter) => {
        const provider = process.env.LLM_PROVIDER ?? 'kimi';
        if (provider === 'openai') return openai;
        if (provider === 'vertex') return vertex;
        // `echo` es el adapter guionable: desarrollo local sin API key y
        // tracer-bullet deterministas (ver echo-llm.adapter.ts).
        if (provider === 'echo') return echo;
        return kimi;
      },
    },
  ],
})
export class AgentModule {}
