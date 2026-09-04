import { Profile } from '../../../profile/domain/profile.aggregate';

// Deep module: "¿sabemos lo suficiente de este comprador?". Deliberadamente
// simple —presupuesto + necesidad ya capturados— y NO la clasificación
// completa de Etapa del funnel, para no atar garantías duras a una
// clasificación que todavía se está afinando (ver agent/CONTEXT.md).
//
// Lo usan dos reglas distintas, y por eso el criterio se nombra una sola vez:
//  · el Agente no PIDE contacto sin esto (INV-4, contact-gate)
//  · el Agente no entrega un VEREDICTO sin esto (INV-8, verdict-verifier)
//
// La razón es la misma en los dos casos: sin saber qué necesita y cuánto puede
// gastar, no hay con qué ponderar. Un veredicto sin eso no es una
// recomendación "para este comprador", es una comparación de fichas disfrazada
// de consejo — y el título tendría que decir "para ti" sin saber quién es.
//
// profile null = nunca calificado (ADR-0012).
export function isQualifiedBuyer(profile: Profile | null): boolean {
  return profile !== null && profile.budgetRange !== null && profile.needs.length > 0;
}
