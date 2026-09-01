// CEB-46: telemetría de infraestructura, deliberadamente fuera del modelo
// DDD — logs estructurados, sin Command/Query/Aggregate (ver
// agent/CONTEXT.md, Flagged ambiguities).
//
// Estas son funciones puras de mapeo (shape crudo del proveedor -> shape
// común), separadas para que sean testeables sin un Logger real ni una
// llamada de verdad al LLM — el gap que había quedado marcado en la QA de
// CEB-46 ("no tiene ningún test").
export interface LlmUsage {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  totalTokens: number | null;
}

export interface VertexUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  cachedContentTokenCount?: number;
  totalTokenCount?: number;
}

export function extractVertexUsage(model: string, usage: VertexUsageMetadata | undefined): LlmUsage | null {
  if (!usage) return null;
  return {
    model,
    inputTokens: usage.promptTokenCount ?? null,
    outputTokens: usage.candidatesTokenCount ?? null,
    cachedTokens: usage.cachedContentTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
  };
}

export interface OpenAiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

export function extractOpenAiUsage(model: string, usage: OpenAiUsage | undefined): LlmUsage | null {
  if (!usage) return null;
  return {
    model,
    inputTokens: usage.prompt_tokens ?? null,
    outputTokens: usage.completion_tokens ?? null,
    cachedTokens: usage.prompt_tokens_details?.cached_tokens ?? null,
    totalTokens: usage.total_tokens ?? null,
  };
}
