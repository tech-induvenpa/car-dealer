import { parseLlmReplyJson } from './prompt';

describe('parseLlmReplyJson', () => {
  it('defaults every optional field to null/[] when the LLM omits them', () => {
    expect(parseLlmReplyJson(JSON.stringify({ message: 'hola' }))).toEqual({
      message: 'hola',
      intentSignal: undefined,
      referencedVehicleIds: [],
      boundaryViolation: null,
      extractedNeed: null,
      extractedMotivation: null,
      extractedObjection: null,
      extractedBudget: null,
      extractedContact: null,
    });
  });

  it('passes through every field when the LLM provides them all', () => {
    const full = {
      message: 'Te recomiendo el CS35',
      intentSignal: 'DECISIVO',
      referencedVehicleIds: [1, 2],
      boundaryViolation: null,
      extractedNeed: { category: 'SUV', detail: 'familia' },
      extractedMotivation: null,
      extractedObjection: null,
      extractedBudget: { min: 0, max: 20000 },
      extractedContact: null,
    };
    expect(parseLlmReplyJson(JSON.stringify(full))).toEqual(full);
  });

  it('treats explicit JSON null the same as an omitted field', () => {
    const result = parseLlmReplyJson(
      JSON.stringify({ message: 'hola', extractedNeed: null, boundaryViolation: null }),
    );
    expect(result.extractedNeed).toBeNull();
    expect(result.boundaryViolation).toBeNull();
  });

  it('strips markdown code fences some providers add despite strict JSON mode (Kimi)', () => {
    const raw = '```json\n' + JSON.stringify({ message: 'hola' }) + '\n```';
    expect(parseLlmReplyJson(raw).message).toBe('hola');
  });
});
