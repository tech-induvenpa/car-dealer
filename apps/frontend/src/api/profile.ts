import { api } from './client'
import { getSessionId } from './analytics'

// Empezar de nuevo es un acto explícito con efecto en el servidor: abandona la
// Conversación ACTIVA y hace que el Agente olvide lo declarado. Antes esto solo
// limpiaba estado de React, así que el hilo nuevo arrancaba sabiendo lo del
// anterior — y el Agente lo trataba como dicho acá.
export function startNewConversation(): Promise<void> {
  return api.post<void>('/agent/conversations/new', { sessionId: getSessionId() })
}
