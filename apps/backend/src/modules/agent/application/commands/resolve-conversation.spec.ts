import { Conversation } from '../../domain/conversation.aggregate';
import { ConversationStatus } from '../../domain/conversation-status';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { ConversationRepository } from '../../domain/ports/conversation.repository';
import { resolveConversation } from './resolve-conversation';

function repoWith(overrides: Partial<jest.Mocked<ConversationRepository>> = {}): jest.Mocked<ConversationRepository> {
  return {
    findActiveBySessionId: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(1),
    ...overrides,
  };
}

function activeConversation(id: number, sessionId: string): Conversation {
  return Conversation.reconstruct({ id, sessionId, status: ConversationStatus.ACTIVA, turns: [] });
}

describe('resolveConversation', () => {
  it('creates a new Conversation when no conversationId is given and no ACTIVA one exists for the session', async () => {
    const repository = repoWith();

    const result = await resolveConversation(repository, 'session-1', undefined);

    expect(repository.findActiveBySessionId).toHaveBeenCalledWith('session-1');
    expect(result.status).toBe(ConversationStatus.ACTIVA);
    expect(result.sessionId).toBe('session-1');
  });

  it('abandons the existing ACTIVA Conversation and creates a new one when no conversationId is given', async () => {
    const existing = activeConversation(1, 'session-1');
    const repository = repoWith({ findActiveBySessionId: jest.fn().mockResolvedValue(existing) });

    const result = await resolveConversation(repository, 'session-1', undefined);

    expect(existing.status).toBe(ConversationStatus.ABANDONADA); // mutado in-place
    expect(repository.save).toHaveBeenCalledWith(existing); // guardó el abandono...
    expect(result).not.toBe(existing); // ...y devolvió una instancia nueva, no la vieja
    expect(result.status).toBe(ConversationStatus.ACTIVA);
  });

  it('never leaves two ACTIVA conversations for the same session at once', async () => {
    const existing = activeConversation(1, 'session-1');
    const repository = repoWith({ findActiveBySessionId: jest.fn().mockResolvedValue(existing) });

    const result = await resolveConversation(repository, 'session-1', undefined);

    expect([existing.status, result.status].filter((s) => s === ConversationStatus.ACTIVA)).toHaveLength(1);
  });

  it('continues the given conversationId when it exists, belongs to the session, and is ACTIVA', async () => {
    const existing = activeConversation(7, 'session-1');
    const repository = repoWith({ findById: jest.fn().mockResolvedValue(existing) });

    const result = await resolveConversation(repository, 'session-1', 7);

    expect(result).toBe(existing);
    expect(repository.findActiveBySessionId).not.toHaveBeenCalled();
  });

  it('throws when the given conversationId does not exist', async () => {
    const repository = repoWith({ findById: jest.fn().mockResolvedValue(null) });

    await expect(resolveConversation(repository, 'session-1', 999)).rejects.toThrow(ConversationNotFoundException);
  });

  it('throws when the given conversationId belongs to a different session', async () => {
    const existing = activeConversation(7, 'session-OTHER');
    const repository = repoWith({ findById: jest.fn().mockResolvedValue(existing) });

    await expect(resolveConversation(repository, 'session-1', 7)).rejects.toThrow(ConversationNotFoundException);
  });

  it('throws when the given conversationId is no longer ACTIVA', async () => {
    const completed = Conversation.reconstruct({
      id: 7,
      sessionId: 'session-1',
      status: ConversationStatus.COMPLETADA,
      turns: [],
    });
    const repository = repoWith({ findById: jest.fn().mockResolvedValue(completed) });

    await expect(resolveConversation(repository, 'session-1', 7)).rejects.toThrow(ConversationNotFoundException);
  });
});
