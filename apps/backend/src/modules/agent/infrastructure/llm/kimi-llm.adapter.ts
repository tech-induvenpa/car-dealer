import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmPort, LlmReply, LlmReplyContext } from '../../domain/ports/llm.port';
import { extractOpenAiUsage } from './log-llm-usage';
import { buildDynamicContent, parseLlmReplyJson, RESPONSE_SCHEMA, STATIC_SYSTEM_PROMPT } from './prompt';

// Moonshot AI (Kimi) expone una API compatible con el formato de OpenAI —
// mismo SDK `openai`, solo cambia baseURL/modelo/auth. Confirmado contra la
// API real: acepta response_format json_schema en modo strict tal como lo
// usa RESPONSE_SCHEMA (ver prompt.ts). Proveedor de producción actual (ver
// memoria de proyecto) — mismo LlmPort que vertex/openai (ADR-0011).
@Injectable()
export class KimiLlmAdapter implements LlmPort {
  private readonly usageLogger = new Logger('KimiLlmUsage');
  private readonly client: OpenAI;
  private readonly model: string;
  // kimi-k3 es un modelo "thinking-only": siempre razona antes de responder
  // (reasoning_content aparte de content, ver moonshot docs). "low" es el
  // menor esfuerzo disponible (low/high/max) — mantiene latencia razonable
  // para un chat en vivo; subir si la calidad de respuesta no alcanza.
  private readonly reasoningEffort: 'low' | 'high' | 'max';

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.KIMI_API_KEY,
      baseURL: process.env.KIMI_BASE_URL ?? 'https://api.moonshot.ai/v1',
    });
    this.model = process.env.KIMI_MODEL ?? 'kimi-k3';
    this.reasoningEffort = (process.env.KIMI_REASONING_EFFORT as 'low' | 'high' | 'max' | undefined) ?? 'low';
  }

  async reply(context: LlmReplyContext): Promise<LlmReply> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      reasoning_effort: this.reasoningEffort,
      messages: [
        { role: 'system', content: STATIC_SYSTEM_PROMPT },
        { role: 'user', content: buildDynamicContent(context) },
      ],
      response_format: RESPONSE_SCHEMA as OpenAI.Chat.Completions.ChatCompletionCreateParams['response_format'],
    });

    const usage = extractOpenAiUsage(this.model, completion.usage);
    if (usage) this.usageLogger.log(usage);

    return parseLlmReplyJson(completion.choices[0]?.message?.content ?? '');
  }
}
