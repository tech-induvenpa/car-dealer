export type TurnIntentSignal = 'EXPLORATORIO' | 'DECISIVO'

export interface ConversationTurn {
  buyerMessage: string
  agentReply: string
  intentSignal: TurnIntentSignal | null
  referencedVehicleIds: number[]
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
}

// Qué vehículo(s) muestra el panel derecho del chat: 'auto' sigue al
// último turno del agente; 'single'/'tray' quedan fijos (pin) hasta que
// llegue un turno nuevo — ver Assistant.tsx.
export type PanelSelection = { mode: 'auto' } | { mode: 'single'; vehicleId: number } | { mode: 'tray' }
