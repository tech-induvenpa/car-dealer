export type TurnIntentSignal = 'EXPLORATORIO' | 'DECISIVO'

export type TurnInputMethod = 'TAP' | 'TYPE'

export interface ConversationTurn {
  buyerMessage: string
  agentReply: string
  intentSignal: TurnIntentSignal | null
  referencedVehicleIds: number[]
  inputMethod: TurnInputMethod
}

// Presente solo cuando el Agente llegó a recomendar Y esa recomendación pasó
// la verificación contra los Ganadores de comparación. Su ausencia es un
// estado normal, no un error: sin ganador claro no hay Veredicto.
export interface Verdict {
  recommendedVehicleId: number
  comparedVehicleIds: number[]
  decisiveField: string
  reason: string
}

export type ConversationStatus = 'ACTIVA' | 'ABANDONADA' | 'COMPLETADA'

export interface Conversation {
  id: number
  sessionId: string
  status: ConversationStatus
  turns: ConversationTurn[]
  createdAt: string
  updatedAt: string
}

export interface SendMessageResult {
  conversationId: number
  reply: string
  referencedVehicleIds: number[]
  verdict: Verdict | null
  // Respuestas pre-formuladas que el Agente ofrece para este turno. No son
  // Atajos —no llevan un hecho de conjunto cerrado— pero tapearlas sigue
  // contando como tap para la señal "tapear vs. escribir".
  suggestedReplies: string[]
  // Qué sabe ya el Agente, para no ofrecer Atajos que preguntan algo que el
  // comprador ya respondió.
  known: { need: boolean; budget: boolean }
}

// Qué vehículo(s) muestra el panel derecho del chat: 'auto' sigue al
// último turno del agente; 'single'/'tray' quedan fijos (pin) hasta que
// llegue un turno nuevo — ver Assistant.tsx.
export type PanelSelection = { mode: 'auto' } | { mode: 'single'; vehicleId: number } | { mode: 'tray' }
