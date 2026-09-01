import { Conversation } from '../conversation.aggregate';
import { ConversationStatus } from '../conversation-status';
import { Profile } from '../../../profile/domain/profile.aggregate';
import { inferFunnelStage } from './funnel-stage';

function conversationWithTurns(
  turns: { buyerMessage: string; agentReply: string; intentSignal?: 'EXPLORATORIO' | 'DECISIVO' | null }[],
): Conversation {
  return Conversation.reconstruct({
    id: 1,
    sessionId: 'session-1',
    status: ConversationStatus.ACTIVA,
    turns: turns.map((t) => ({ ...t, intentSignal: t.intentSignal ?? null, referencedVehicleIds: [] })),
  });
}

function profileWith(overrides: { needs?: number; budget?: boolean } = {}): Profile {
  const profile = Profile.reconstruct({
    id: 1,
    sessionId: 'session-1',
    needs: [],
    motivations: [],
    objections: [],
    budgetRange: null,
  });
  if (overrides.needs) {
    for (let i = 0; i < overrides.needs; i++) profile.captureNeed('SUV', 'detalle');
  }
  if (overrides.budget) {
    profile.captureBudget(0, 20000);
  }
  return profile;
}

describe('inferFunnelStage', () => {
  it('is ENTRADA when there are no turns yet', () => {
    expect(inferFunnelStage(conversationWithTurns([]), profileWith())).toBe('ENTRADA');
  });

  it('is CALIFICACION_TEMPRANA once there is a turn but no budget/need captured', () => {
    const conversation = conversationWithTurns([{ buyerMessage: 'hola', agentReply: 'hola' }]);
    expect(inferFunnelStage(conversation, profileWith())).toBe('CALIFICACION_TEMPRANA');
  });

  it('is DESCUBRIMIENTO once qualified, without a per-turn signal (today\'s stub reality)', () => {
    const conversation = conversationWithTurns([{ buyerMessage: 'busco un SUV', agentReply: '...' }]);
    expect(inferFunnelStage(conversation, profileWith({ needs: 1, budget: true }))).toBe('DESCUBRIMIENTO');
  });

  it('is DESCUBRIMIENTO when the last turn is explicitly EXPLORATORIO, even if already qualified', () => {
    const conversation = conversationWithTurns([
      { buyerMessage: 'busco un SUV', agentReply: '...', intentSignal: 'DECISIVO' },
      { buyerMessage: '¿qué es el ABS?', agentReply: '...', intentSignal: 'EXPLORATORIO' },
    ]);
    expect(inferFunnelStage(conversation, profileWith({ needs: 1, budget: true }))).toBe('DESCUBRIMIENTO');
  });

  it('is SENAL_DE_INTENCION when the last turn is DECISIVO and the Profile is qualified', () => {
    const conversation = conversationWithTurns([
      { buyerMessage: 'me interesa cotizar', agentReply: '...', intentSignal: 'DECISIVO' },
    ]);
    expect(inferFunnelStage(conversation, profileWith({ needs: 1, budget: true }))).toBe('SENAL_DE_INTENCION');
  });

  it('demonstrates non-linear behavior: goes back to DESCUBRIMIENTO after a later EXPLORATORIO turn', () => {
    const profile = profileWith({ needs: 1, budget: true });
    const atIntent = conversationWithTurns([
      { buyerMessage: 'me interesa cotizar', agentReply: '...', intentSignal: 'DECISIVO' },
    ]);
    expect(inferFunnelStage(atIntent, profile)).toBe('SENAL_DE_INTENCION');

    const backToBasics = conversationWithTurns([
      { buyerMessage: 'me interesa cotizar', agentReply: '...', intentSignal: 'DECISIVO' },
      { buyerMessage: '¿qué es el ABS?', agentReply: '...', intentSignal: 'EXPLORATORIO' },
    ]);
    // mismo Profile (nunca se "des-captura" nada), pero la Etapa reportada
    // retrocede porque se reevalúa desde cero en cada turno — no hay Estado
    // forzado detrás (ver agent/CONTEXT.md).
    expect(inferFunnelStage(backToBasics, profile)).toBe('DESCUBRIMIENTO');
  });
});
