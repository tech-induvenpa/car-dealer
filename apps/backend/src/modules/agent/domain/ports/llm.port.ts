import { Turn, TurnIntentSignal } from '../conversation.aggregate';
import { MotivationCategory, NeedCategory, ObjectionCategory } from '../../../profile/domain/profile.aggregate';

export const LLM_PORT = Symbol('LlmPort');

// Nota de diseño (CEB-44): esta es una excepción deliberada al patrón
// "referenciar por ID" que usan Leads/Analytics hacia Catalog — acá Agent
// no referencia un Profile existente, construye datos NUEVOS con la forma
// exacta que Profile espera, así que reusa sus tipos de categoría en vez de
// duplicarlos. Ver profile/CONTEXT.md y agent/CONTEXT.md.
export interface ExtractedNeed {
  category: NeedCategory;
  detail: string;
}

export interface ExtractedMotivation {
  category: MotivationCategory;
  detail: string;
}

export interface ExtractedObjection {
  category: ObjectionCategory;
  detail: string;
}

export interface ExtractedBudget {
  min: number;
  max: number;
}

export interface ExtractedContact {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CandidateVehicle {
  vehicleId: number;
  brand: string;
  model: string;
  trim: string;
  year: number;
  category: string;
  priceUsd: number;
}

export interface LlmReplyContext {
  turns: Turn[];
  buyerMessage: string;
  // candidatos reales del catálogo publicado — sin esto el modelo no tiene
  // forma de recomendar un vehicleId real, solo de alucinar uno (ver
  // vehicles/domain/ports/vehicle.repository.ts#findAllPublished).
  candidateVehicles: CandidateVehicle[];
}

// Señal estructurada, no texto libre — la enforcement de INV-2/INV-6 la hace
// el código (SendMessageHandler), reemplazando `message` por una respuesta
// fija cuando esto no es null. Ver docs/adr/0011-agent-scoped-not-generic.md.
export type BoundaryViolation = 'OUT_OF_SCOPE' | 'COMMITS_DISCOUNT_OR_FINANCING';

export interface LlmReply {
  message: string;
  // opcional — el adapter real (CEB-42) la completa como parte de su salida
  // estructurada; el stub de CEB-38 no la produce.
  intentSignal?: TurnIntentSignal;
  // vehicleIds que el modelo dice haber mencionado/recomendado en `message`
  // — insumo para CatalogGroundingGuard (INV-1), no una garantía en sí misma.
  referencedVehicleIds?: number[];
  boundaryViolation?: BoundaryViolation | null;
  // hechos nuevos identificados en ESTE turno — null/ausente cuando el
  // turno no reveló nada nuevo de ese tipo. SendMessageHandler los captura
  // en Profile vía findOrCreateProfile, no vía CommandBus (ver CEB-44).
  extractedNeed?: ExtractedNeed | null;
  extractedMotivation?: ExtractedMotivation | null;
  extractedObjection?: ExtractedObjection | null;
  extractedBudget?: ExtractedBudget | null;
  // solo se usa si el comprador YA dejó su contacto en este turno — el
  // gate de INV-4 (assertCanRequestContact) decide si se puede usar de
  // verdad para crear un Lead (ver CEB-47).
  extractedContact?: ExtractedContact | null;
}

// Puerto hexagonal: aísla al Agente del proveedor LLM concreto (ver
// docs/adr/0011-agent-scoped-not-generic.md). El adapter real (CEB-42)
// implementa esto construyendo el system prompt cacheable; el stub de esta
// slice solo prueba que la orquestación funciona end-to-end.
export interface LlmPort {
  reply(context: LlmReplyContext): Promise<LlmReply>;
}
