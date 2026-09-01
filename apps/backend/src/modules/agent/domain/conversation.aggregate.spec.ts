import { ConversationNotActiveException } from './exceptions/conversation-not-active.exception';
import { InvalidConversationStatusTransitionException } from './exceptions/invalid-conversation-status-transition.exception';
import { Conversation, CreateConversationProps } from './conversation.aggregate';
import { ConversationStatus } from './conversation-status';

function validProps(overrides: Partial<CreateConversationProps> = {}): CreateConversationProps {
  return { sessionId: 'session-123', ...overrides };
}

describe('Conversation aggregate', () => {
  it('creates a conversation with status ACTIVA and no turns', () => {
    const conversation = Conversation.create(validProps());
    expect(conversation.id).toBeNull();
    expect(conversation.status).toBe(ConversationStatus.ACTIVA);
    expect(conversation.turns).toEqual([]);
  });

  describe('recordTurn', () => {
    it('appends a turn while ACTIVA', () => {
      const conversation = Conversation.reconstruct({
        id: 1,
        sessionId: 'session-123',
        status: ConversationStatus.ACTIVA,
        turns: [],
      });
      conversation.recordTurn('¿tienen SUV familiares?', 'Sí, tenemos varias opciones...');

      expect(conversation.turns).toEqual([
        {
          buyerMessage: '¿tienen SUV familiares?',
          agentReply: 'Sí, tenemos varias opciones...',
          intentSignal: null,
          referencedVehicleIds: [],
        },
      ]);
    });

    it('rejects recording a turn on a conversation that is not ACTIVA', () => {
      const conversation = Conversation.reconstruct({
        id: 1,
        sessionId: 'session-123',
        status: ConversationStatus.ABANDONADA,
        turns: [],
      });
      expect(() => conversation.recordTurn('hola', 'hola')).toThrow(ConversationNotActiveException);
    });

    it('defaults intentSignal to null when the caller does not provide one (stub LlmPort)', () => {
      const conversation = Conversation.reconstruct({
        id: 1,
        sessionId: 'session-123',
        status: ConversationStatus.ACTIVA,
        turns: [],
      });
      conversation.recordTurn('hola', 'hola');
      expect(conversation.turns[0].intentSignal).toBeNull();
    });

    it('stores intentSignal when the caller provides one (real LLM, CEB-42)', () => {
      const conversation = Conversation.reconstruct({
        id: 1,
        sessionId: 'session-123',
        status: ConversationStatus.ACTIVA,
        turns: [],
      });
      conversation.recordTurn('¿qué es un SUV?', 'Es un tipo de carrocería...', 'EXPLORATORIO');
      expect(conversation.turns[0].intentSignal).toBe('EXPLORATORIO');
    });

    it('stores referencedVehicleIds when the caller provides them (real LLM + CatalogGroundingGuard)', () => {
      const conversation = Conversation.reconstruct({
        id: 1,
        sessionId: 'session-123',
        status: ConversationStatus.ACTIVA,
        turns: [],
      });
      conversation.recordTurn('¿me mostrás el CS35 Plus?', 'Claro, acá está...', 'EXPLORATORIO', [7, 9]);
      expect(conversation.turns[0].referencedVehicleIds).toEqual([7, 9]);
    });
  });

  describe('changeStatus', () => {
    function reconstructed(status: ConversationStatus): Conversation {
      return Conversation.reconstruct({ id: 1, sessionId: 'session-123', status, turns: [] });
    }

    it('allows ACTIVA -> ABANDONADA', () => {
      const conversation = reconstructed(ConversationStatus.ACTIVA);
      conversation.changeStatus(ConversationStatus.ABANDONADA);
      expect(conversation.status).toBe(ConversationStatus.ABANDONADA);
    });

    it('allows ACTIVA -> COMPLETADA', () => {
      const conversation = reconstructed(ConversationStatus.ACTIVA);
      conversation.changeStatus(ConversationStatus.COMPLETADA);
      expect(conversation.status).toBe(ConversationStatus.COMPLETADA);
    });

    it('rejects any transition out of ABANDONADA (final state)', () => {
      const conversation = reconstructed(ConversationStatus.ABANDONADA);
      expect(() => conversation.changeStatus(ConversationStatus.ACTIVA)).toThrow(
        InvalidConversationStatusTransitionException,
      );
    });

    it('rejects any transition out of COMPLETADA (final state)', () => {
      const conversation = reconstructed(ConversationStatus.COMPLETADA);
      expect(() => conversation.changeStatus(ConversationStatus.ABANDONADA)).toThrow(
        InvalidConversationStatusTransitionException,
      );
    });
  });
});
