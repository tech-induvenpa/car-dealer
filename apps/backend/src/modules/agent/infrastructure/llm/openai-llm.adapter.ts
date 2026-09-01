import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmPort, LlmReply, LlmReplyContext } from '../../domain/ports/llm.port';
import { extractOpenAiUsage } from './log-llm-usage';
import { buildDynamicContent, parseLlmReplyJson, RESPONSE_SCHEMA, STATIC_SYSTEM_PROMPT } from './prompt';

// ponytail: adapter de prueba (a pedido explícito, ver git history) — el
// proveedor de producción actual es Kimi (kimi-llm.adapter.ts, ver memoria
// de proyecto). Mismo LlmPort, mismo prompt.ts — swap trivial vía LLM_PROVIDER.
@Injectable()
export class OpenAiLlmAdapter implements LlmPort {
  private readonly usageLogger = new Logger('OpenAiLlmUsage');
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async reply(context: LlmReplyContext): Promise<LlmReply> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
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
