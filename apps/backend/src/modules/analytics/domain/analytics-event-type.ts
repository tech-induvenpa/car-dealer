export enum AnalyticsEventType {
  VEHICLE_VIEWED = 'VEHICLE_VIEWED',
  VEHICLE_ADDED_TO_COMPARISON = 'VEHICLE_ADDED_TO_COMPARISON',
  COMPARISON_PERFORMED = 'COMPARISON_PERFORMED',
  QUIZ_COMPLETED = 'QUIZ_COMPLETED',
  LEAD_SUBMITTED = 'LEAD_SUBMITTED',
  // CEB-45 — reactivos desde profile/ y agent/, mismo patrón que
  // LEAD_SUBMITTED (ADR-0004): sessionId queda null a propósito, esos
  // aggregates no cargan ese dato solo para servirle a Analytics.
  NEED_CAPTURED = 'NEED_CAPTURED',
  MOTIVATION_CAPTURED = 'MOTIVATION_CAPTURED',
  OBJECTION_CAPTURED = 'OBJECTION_CAPTURED',
  BUDGET_CAPTURED = 'BUDGET_CAPTURED',
  FUNNEL_STAGE_REACHED = 'FUNNEL_STAGE_REACHED',
  // CEB-36-UI-06: directo desde el frontend (como QUIZ_COMPLETED), no
  // reactivo — mide si el comprador cancela por no querer perder la
  // Conversación anterior (señal barata de interés en historial, ver
  // memoria de proyecto sobre la idea de monetización).
  NEW_CONVERSATION_WARNING_DECIDED = 'NEW_CONVERSATION_WARNING_DECIDED',
  // CEB-87: criterio de ÉXITO del pivote, separado de COMPARISON_PERFORMED
  // (adopción) — con la regla 9 el Agente puede contrastar un par y no
  // llegar a Veredicto, así que un solo evento no puede medir las dos cosas.
  VERDICT_DELIVERED = 'VERDICT_DELIVERED',
}
