# Agent (Agente conversacional)

Orquesta la conversación con el comprador: sugiere y compara Vehículos del Catalog, nutre el Perfil de Cliente a medida que avanza, y crea un Lead cuando el comprador deja contacto real. Acotado al descubrimiento de vehículos — no es un motor de conversación genérico reusable para otros dominios (ver Flagged ambiguities de `profile/CONTEXT.md` sobre el alcance).

## Language

**Conversación**:
La interacción continua entre el comprador y el Agente, desde el primer mensaje hasta que se abandona o se completa. Tiene un Estado y puede pasar por varias Etapas del funnel a lo largo de su vida.
_Avoid_: sesión (se confunde con la Sesión anónima de Analytics, que es un concepto de correlación, no de dominio del Agente), chat (demasiado genérico).

**Estado (de la Conversación)**:
`ACTIVA | ABANDONADA | COMPLETADA` — lo único que el dominio fuerza formalmente sobre la Conversación. Solo avanza, mismo patrón que Estado del Lead.
_Avoid_: etapa (ver Etapa del funnel — es un concepto distinto y no forzado).

**Etapa del funnel**:
La lectura del Agente sobre en qué punto del recorrido de descubrimiento-a-cotización está el comprador (Entrada, Calificación, Descubrimiento, Comparación, Señal de intención, Captura de contacto, Cotización). Se reevalúa en cada turno — no es una transición de Estado forzada por el dominio, la Conversación puede volver a una Etapa anterior. Se usa para adaptar el comportamiento del Agente (ej. preguntas abiertas en Descubrimiento vs. cierre incisivo en Señal de intención) y se registra como evento para Analytics.
_Avoid_: estado, fase (para no confundir con Estado de la Conversación).

## Relationships

- El **Agente** sugiere y compara **Vehículo**s del Catalog, por ID — referencia únicamente, nunca copia datos.
- El **Agente** construye/actualiza un **Perfil** a medida que la **Conversación** avanza.
- El **Agente** crea un **Lead** (referenciando el **Perfil** vía `profileId`) cuando el comprador deja contacto real.
- El **Agente** publica un evento por cada **Etapa del funnel** alcanzada, consumido por Analytics — mismo patrón que `LeadSubmittedEvent` (ver `docs/adr/0004-leads-analytics-integration-via-domain-event.md`), sin que el Agente sepa que Analytics existe.

## Example dialogue

> **Dev:** "Si el comprador vuelve a preguntar algo básico después de haber llegado a Señal de intención, ¿la Conversación retrocede de Etapa?"
> **Domain expert:** "Sí, sin problema — la Etapa no es un estado forzado, es la lectura del Agente en ese momento. Lo que no cambia es el Estado: sigue ACTIVA."

## Flagged ambiguities

- El consumo de tokens (input/output/cached) de las llamadas al LLM es telemetría de infraestructura, no un concepto de dominio ni un Evento de Analytics — se resolvió explícitamente no mezclarlo con el Dashboard de Analytics (comportamiento de comprador). **Resuelto (CEB-46)**: logs estructurados vía `Logger` de NestJS (`VertexLlmUsage`), sin Command/Query/Aggregate. Si más adelante hace falta un dashboard de costos real, se revisa — hoy el log ya es consultable.
- Qué comportamiento específico corresponde a cada Etapa (tono, tipo de pregunta, nivel de insistencia) debe basarse en estándares estudiados de flujos de venta, no inventarse — pendiente definir cuál estándar/metodología aplica. No resuelto en esta sesión (ver [[project_sales_standardization]] en memoria del proyecto).
- **Resuelto (CEB-43)**: cómo se infiere la Etapa — heurística determinista sobre `Profile`/`Conversation` (`inferFunnelStage`), sin interpretar texto libre. El **Turno** sí quedó modelado como concepto de dominio con esta slice: tiene `intentSignal` opcional (`EXPLORATORIO | DECISIVO`), producido por el LLM real (CEB-42) — con el adapter stub de CEB-38 siempre es `null`, así que el retroceso de Etapa entre turnos solo se observa en la práctica una vez que exista el adapter real. El **Mensaje** en sí (contenido libre de cada Turno) sigue sin modelarse como concepto propio — es solo un string.
- El gate de INV-4 (`assertCanRequestContact`) usa un criterio deliberadamente más simple que la Etapa completa (solo presupuesto + necesidad) — es un concepto hermano, no el mismo cálculo, para no atar la garantía dura del invariante a la clasificación de 4 etapas (que sí puede seguir cambiando/afinándose sin tocar el gate).
- **Resuelto (CEB-44)**: el Agente captura datos en Perfil llamando directamente sus comandos/aggregate (vía `findOrCreateProfile`, no por `CommandBus`) — los buses de NestJS/CQRS sí se comparten entre módulos que importan `CqrsModule` (confirmado empíricamente), pero para una escritura síncrona dentro de la misma ejecución de `SendMessageCommand` la llamada directa es más simple y explícita. Esto significa que el puerto `LlmPort` (`ExtractedNeed`/`ExtractedMotivation`/`ExtractedObjection`) reusa los tipos de categoría de `profile/domain/profile.aggregate.ts` en vez de duplicarlos — una excepción deliberada al patrón "referenciar solo por ID" que usan Leads/Analytics hacia Catalog, justificada porque acá Agent construye datos nuevos con la forma exacta que Profile espera, no una referencia a algo ya existente.
