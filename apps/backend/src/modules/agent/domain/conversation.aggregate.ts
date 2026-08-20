import { AggregateRoot } from '@nestjs/cqrs';
import { ConversationStatus } from './conversation-status';
import { ConversationNotActiveException } from './exceptions/conversation-not-active.exception';
import { InvalidConversationStatusTransitionException } from './exceptions/invalid-conversation-status-transition.exception';

// ponytail: Estado simple, solo avanza — mismo patrón que LeadStatus. La
// Etapa del funnel (Entrada/Calificación/Descubrimiento/...) NO vive acá,
// es informativa y se resuelve en CEB-43; este Estado es lo único que el
// dominio fuerza (ver agent/CONTEXT.md).
const ALLOWED_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  [ConversationStatus.ACTIVA]: [ConversationStatus.ABANDONADA, ConversationStatus.COMPLETADA],
  [ConversationStatus.ABANDONADA]: [],
  [ConversationStatus.COMPLETADA]: [],
};

// Señal por-turno, opcional — la produce el LLM real (CEB-42) como parte de
// su salida estructurada. El stub de CEB-38 no la produce (queda null), así
// que la Etapa del funnel solo puede "retroceder" de verdad una vez que
// exista un adapter real (ver funnel-stage.ts).
export type TurnIntentSignal = 'EXPLORATORIO' | 'DECISIVO';

export interface Turn {
  buyerMessage: string;
  agentReply: string;
  intentSignal: TurnIntentSignal | null;
  // vehicleIds que el Agente mencionó en este turno, ya validados contra
  // Catalog (CatalogGroundingGuard) — insumo para refinar inferFunnelStage
  // ("Comparación asistida") más adelante, ver funnel-stage.ts.
  referencedVehicleIds: number[];
}

export interface CreateConversationProps {
  sessionId: string;
}

export interface ReconstructConversationProps {
  id: number;
  sessionId: string;
  status: ConversationStatus;
  turns: Turn[];
}

export class Conversation extends AggregateRoot {
  private constructor(
    private _id: number | null,
    private readonly _sessionId: string,
    private _status: ConversationStatus,
    private _turns: Turn[],
  ) {
    super();
  }

  static create(props: CreateConversationProps): Conversation {
    return new Conversation(null, props.sessionId, ConversationStatus.ACTIVA, []);
  }

  static reconstruct(props: ReconstructConversationProps): Conversation {
    return new Conversation(props.id, props.sessionId, props.status, props.turns);
  }

  recordTurn(
    buyerMessage: string,
    agentReply: string,
    intentSignal: TurnIntentSignal | null = null,
    referencedVehicleIds: number[] = [],
  ): void {
    if (this._status !== ConversationStatus.ACTIVA) {
      throw new ConversationNotActiveException();
    }
    this._turns = [...this._turns, { buyerMessage, agentReply, intentSignal, referencedVehicleIds }];
  }

  changeStatus(newStatus: ConversationStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new InvalidConversationStatusTransitionException(this._status, newStatus);
    }
    this._status = newStatus;
  }

  get id(): number | null {
    return this._id;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get status(): ConversationStatus {
    return this._status;
  }

  get turns(): Turn[] {
    return this._turns;
  }
}
