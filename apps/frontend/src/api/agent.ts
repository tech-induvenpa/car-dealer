import { api } from './client'
import { getSessionId } from './analytics'
import type { Conversation, SendMessageResult } from '../types/agent'

// undefined (no `sessionId` con Conversación ACTIVA) — no lanza, es un
// estado válido (comprador sin conversación en curso).
export function getActiveConversation(): Promise<Conversation | undefined> {
  return api.get<Conversation | undefined>(`/agent/conversations/active/${getSessionId()}`)
}

// shortcutId: el Atajo que el comprador tapeó, si tapeó uno. Su hecho se
// aplica al Perfil de forma determinista, sin pasar por el modelo — y el mismo
// campo es la señal "tapear vs. escribir" que se quería medir.
export function sendMessage(
  message: string,
  conversationId?: number,
  shortcutId?: string,
): Promise<SendMessageResult> {
  return api.post<SendMessageResult>('/agent/messages', {
    sessionId: getSessionId(),
    message,
    conversationId,
    shortcutId,
  })
}
