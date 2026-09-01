import { extractOpenAiUsage, extractVertexUsage } from './log-llm-usage';

describe('extractVertexUsage', () => {
  it('maps promptTokenCount/candidatesTokenCount/cachedContentTokenCount/totalTokenCount', () => {
    expect(
      extractVertexUsage('gemini-3.6-flash', {
        promptTokenCount: 120,
        candidatesTokenCount: 40,
        cachedContentTokenCount: 80,
        totalTokenCount: 160,
      }),
    ).toEqual({ model: 'gemini-3.6-flash', inputTokens: 120, outputTokens: 40, cachedTokens: 80, totalTokens: 160 });
  });

  it('returns null when there is no usage metadata at all (nothing to log)', () => {
    expect(extractVertexUsage('gemini-3.6-flash', undefined)).toBeNull();
  });

  it('fills missing individual fields with null instead of throwing', () => {
    expect(extractVertexUsage('gemini-3.6-flash', {})).toEqual({
      model: 'gemini-3.6-flash',
      inputTokens: null,
      outputTokens: null,
      cachedTokens: null,
      totalTokens: null,
    });
  });
});

describe('extractOpenAiUsage', () => {
  it('maps prompt_tokens/completion_tokens/total_tokens and nested cached_tokens', () => {
    expect(
      extractOpenAiUsage('gpt-4o-mini', {
        prompt_tokens: 100,
        completion_tokens: 30,
        total_tokens: 130,
        prompt_tokens_details: { cached_tokens: 64 },
      }),
    ).toEqual({ model: 'gpt-4o-mini', inputTokens: 100, outputTokens: 30, cachedTokens: 64, totalTokens: 130 });
  });

  it('returns null cachedTokens when prompt_tokens_details is absent (no caching used)', () => {
    expect(extractOpenAiUsage('gpt-4o-mini', { prompt_tokens: 100, completion_tokens: 30, total_tokens: 130 })).toEqual(
      { model: 'gpt-4o-mini', inputTokens: 100, outputTokens: 30, cachedTokens: null, totalTokens: 130 },
    );
  });

  it('returns null when there is no usage at all', () => {
    expect(extractOpenAiUsage('gpt-4o-mini', undefined)).toBeNull();
  });
});
