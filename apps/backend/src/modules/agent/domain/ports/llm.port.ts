import { Turn, TurnIntentSignal } from '../conversation.aggregate';
import { FunnelStage } from '../services/funnel-stage';
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

// Lo que el modelo PROPONE como Veredicto. No es el Veredicto todavía: el
// código lo audita contra los Ganadores de comparación antes de dejarlo salir
// (ver domain/services/verdict-verifier.ts). El Campo decisivo viaja
// estructurado justamente para poder verificarlo — inferirlo del texto
// convertiría la regla en una promesa del prompt.
export interface ProposedVerdictFromLlm {
  recommendedVehicleId: number;
  decisiveField: string;
  reason: string;
}

export interface ExtractedContact {
  firstName: string;
  lastName: string;
  phone: string;
}

// ponytail: espejo primitivo de VehicleSpecs (mismos campos, sin importar
// los enums de Vehicles — mismo criterio que brand/category acá abajo, ya
// castings a string). Se manda completa a propósito: la primera versión
// solo mandaba brand/model/trim/year/category/price y el Agente no podía
// responder preguntas de ficha técnica (ej. consumo) — encontrado probando
// manualmente. Con 5 vehículos publicados hoy esto es barato; si el
// catálogo crece mucho, la mejora es mandar ficha completa solo de los
// vehículos ya referenciados en la Conversación, no de todo el catálogo.
export interface CandidateVehicleSpecs {
  displacementCc: number | null;
  cylinders: number | null;
  horsepowerHp: number | null;
  torqueNm: number | null;
  fuelType: string;
  transmissionType: string;
  transmissionSpeeds: number | null;
  driveType: string;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  wheelbaseMm: number | null;
  trunkCapacityL: number | null;
  weightKg: number | null;
  passengerCapacity: number | null;
  fuelEconomyValue: number | null;
  fuelEconomyUnit: string | null;
  fuelEconomyNormalizedKmPerL: number | null;
  tankCapacityL: number | null;
  airbagsCount: number | null;
  hasAbs: boolean;
  hasStabilityControl: boolean;
  hasRearCamera: boolean;
  seatType: string | null;
  hasBluetooth: boolean;
  hasCarPlay: boolean;
  warrantyYears: number | null;
  warrantyKm: number | null;
  highlights: string[];
}

export interface CandidateVehicle {
  vehicleId: number;
  brand: string;
  model: string;
  trim: string;
  year: number;
  category: string;
  priceUsd: number;
  specs: CandidateVehicleSpecs;
}

// Lo que ya se sabe del comprador ANTES de este turno — para que el
// Agente pregunte por lo que falta, no repita lo que ya tiene (ver pedido
// del usuario: "preguntas abiertas... acorde a lo que va perfilando").
export interface ProfileSummary {
  needs: { category: string; detail: string }[];
  motivations: { category: string; detail: string }[];
  objections: { category: string; detail: string }[];
  budgetRange: { min: number; max: number } | null;
}

export interface LlmReplyContext {
  turns: Turn[];
  buyerMessage: string;
  // candidatos reales del catálogo publicado — sin esto el modelo no tiene
  // forma de recomendar un vehicleId real, solo de alucinar uno (ver
  // vehicles/domain/ports/vehicle.repository.ts#findAllPublished).
  candidateVehicles: CandidateVehicle[];
  // Etapa ANTES de este turno (inferFunnelStage sobre el estado previo) —
  // le da al LLM el mismo criterio que ya usa el sistema para decidir su
  // propio comportamiento (ej. siempre preguntar algo abierto en
  // DESCUBRIMIENTO), sin que sea un Estado forzado (ver funnel-stage.ts).
  currentStage: FunnelStage;
  profileSummary: ProfileSummary;
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
  // Campos más de la respuesta por turno, NO una llamada aparte: la respuesta
  // ya es estructurada, y un segundo round-trip duplicaría latencia y costo
  // justo en el turno más importante de la conversación.
  proposedVerdict?: ProposedVerdictFromLlm | null;
  // Respuestas pre-formuladas que el Agente ofrece para ESTE turno. No son
  // Atajos: un Atajo lleva un hecho de conjunto cerrado que el sistema conoce
  // de antemano; esto es texto que el comprador puede tapear en vez de
  // escribir. Las dos cosas son un tap, solo una es determinista.
  suggestedReplies?: string[];
}

// Puerto hexagonal: aísla al Agente del proveedor LLM concreto (ver
// docs/adr/0011-agent-scoped-not-generic.md). El adapter real (CEB-42)
// implementa esto construyendo el system prompt cacheable; el stub de esta
// slice solo prueba que la orquestación funciona end-to-end.
export interface LlmPort {
  reply(context: LlmReplyContext): Promise<LlmReply>;
}
