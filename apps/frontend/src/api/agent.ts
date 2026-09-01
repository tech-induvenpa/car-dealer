import { api } from './client'
import { getSessionId } from './analytics'
import type { Conversation, SendMessageResult } from '../types/agent'

// undefined (no `sessionId` con Conversación ACTIVA) — no lanza, es un
// estado válido (comprador sin conversación en curso).
export function getActiveConversation(): Promise<Conversation | undefined> {
  return api.get<Conversation | undefined>(`/agent/conversations/active/${getSessionId()}`)
}

export function sendMessage(message: string, conversationId?: number): Promise<SendMessageResult> {
  return api.post<SendMessageResult>('/agent/messages', {
    sessionId: getSessionId(),
    message,
    conversationId,
  })
}
