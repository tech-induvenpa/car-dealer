import { Injectable } from '@nestjs/common';
import { LlmPort, LlmReply, LlmReplyContext } from '../../domain/ports/llm.port';

// ponytail: stub deliberado — el adapter real de proveedor (CEB-42) lo
// reemplaza sin tocar SendMessageHandler ni el resto del dominio, esa es
// la frontera hexagonal que existe a propósito.
//
// Guionable (CEB-88): si el mensaje del comprador ES un JSON de LlmReply, se
// devuelve tal cual. Sirve para desarrollo local sin API key y para los
// tracer-bullet, que necesitan forzar una respuesta concreta sin depender del
// proveedor real y sin overrides de provider en el grafo de DI — el adapter
// se elige por LLM_PROVIDER, igual que en producción.
@Injectable()
export class EchoLlmAdapter implements LlmPort {
  async reply(context: LlmReplyContext): Promise<LlmReply> {
    const scripted = parseScriptedReply(context.buyerMessage);
    if (scripted) return scripted;

    // El eco incluye lo que el Agente sabía AL ARMAR este turno, así que
    // permite verificar el orden de aplicación de hechos (INV-12) sin
    // instrumentar el handler.
    return {
      message: `[stub] stage=${context.currentStage} profile=${JSON.stringify(context.profileSummary)}`,
    };
  }
}

function parseScriptedReply(buyerMessage: string): LlmReply | null {
  const trimmed = buyerMessage.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<LlmReply>;
    return parsed.message === undefined ? null : (parsed as LlmReply);
  } catch {
    return null;
  }
}
