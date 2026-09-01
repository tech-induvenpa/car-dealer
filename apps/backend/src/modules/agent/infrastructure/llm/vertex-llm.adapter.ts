import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { LlmPort, LlmReply, LlmReplyContext } from '../../domain/ports/llm.port';
import { extractVertexUsage } from './log-llm-usage';
import { buildDynamicContent, parseLlmReplyJson, STATIC_SYSTEM_PROMPT } from './prompt';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING },
    intentSignal: { type: Type.STRING, enum: ['EXPLORATORIO', 'DECISIVO'] },
    referencedVehicleIds: { type: Type.ARRAY, items: { type: Type.INTEGER } },
    boundaryViolation: {
      type: Type.STRING,
      enum: ['OUT_OF_SCOPE', 'COMMITS_DISCOUNT_OR_FINANCING'],
    },
    extractedNeed: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: ['SUV', 'COMPACTO', 'PICKUP'] },
        detail: { type: Type.STRING },
      },
    },
    extractedMotivation: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: ['PRIMERA_COMPRA', 'REEMPLAZO', 'OTRO'] },
        detail: { type: Type.STRING },
      },
    },
    extractedObjection: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: ['PRECIO', 'FINANCIAMIENTO', 'MARCA', 'OTRO'] },
        detail: { type: Type.STRING },
      },
    },
    extractedBudget: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.INTEGER },
        max: { type: Type.INTEGER },
      },
    },
    extractedContact: {
      type: Type.OBJECT,
      properties: {
        firstName: { type: Type.STRING },
        lastName: { type: Type.STRING },
        phone: { type: Type.STRING },
      },
    },
  },
  required: ['message'],
};

// ponytail: no verificado contra Vertex real todavía (sin credenciales en
// esta sesión) — la forma exacta de `response.text` está documentada por
// el SDK (@google/genai), pero si cambia, este es el único lugar a tocar.
function extractText(response: { text?: string }): string {
  return response.text ?? '';
}

@Injectable()
export class VertexLlmAdapter implements LlmPort {
  private readonly usageLogger = new Logger('VertexLlmUsage');
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor() {
    this.client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
    });
    this.model = process.env.VERTEX_MODEL ?? 'gemini-3.6-flash';
  }

  async reply(context: LlmReplyContext): Promise<LlmReply> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: buildDynamicContent(context) }] }],
      config: {
        systemInstruction: STATIC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const usage = extractVertexUsage(this.model, response.usageMetadata);
    if (usage) this.usageLogger.log(usage);

    return parseLlmReplyJson(extractText(response));
  }
}
