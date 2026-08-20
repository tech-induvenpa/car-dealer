import { FunnelStage } from '../services/funnel-stage';

// Publicado por la capa de aplicación (no por Conversation.apply()) porque
// inferFunnelStage necesita a Profile, de otro contexto — un aggregate no
// debería tomar otro aggregate como parámetro de un método de dominio.
// El wiring real (llamar inferFunnelStage + publicar esto) se conecta en
// CEB-44, cuando SendMessageHandler ya tenga acceso a Profile.
export class FunnelStageReachedEvent {
  constructor(
    public readonly conversationId: number,
    public readonly stage: FunnelStage,
  ) {}
}
