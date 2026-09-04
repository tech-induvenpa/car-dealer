# Agent (Agente conversacional)

Orquesta la conversación con el comprador: sugiere y compara Vehículos del Catalog, nutre el Perfil de Cliente a medida que avanza, y crea un Lead cuando el comprador deja contacto real. Acotado al descubrimiento de vehículos — no es un motor de conversación genérico reusable para otros dominios (ver Flagged ambiguities de `profile/CONTEXT.md` sobre el alcance).

## Language

**Conversación**:
La interacción continua entre el comprador y el Agente, desde el primer mensaje hasta que se abandona o se completa. Tiene un Estado y puede pasar por varias Etapas del funnel a lo largo de su vida. Un mismo visitante (misma Sesión anónima) puede tener **varias** Conversaciones a lo largo del tiempo — no hay una relación 1 a 1 con la Sesión. Cada Conversación tiene su propia identidad (`conversationId`), y se referencia explícitamente para continuarla; omitir esa referencia siempre inicia una Conversación nueva.
_Avoid_: sesión (se confunde con la Sesión anónima de Analytics, que es un concepto de correlación 1-a-N con Conversación, no la Conversación en sí), chat (demasiado genérico), "Research Session" (término de la UI de referencia — es el mismo concepto que Conversación, no uno nuevo).

**Estado (de la Conversación)**:
`ACTIVA | ABANDONADA | COMPLETADA` — lo único que el dominio fuerza formalmente sobre la Conversación. Solo avanza, mismo patrón que Estado del Lead.
_Avoid_: etapa (ver Etapa del funnel — es un concepto distinto y no forzado).

**Etapa del funnel**:
La lectura del Agente sobre en qué punto del recorrido de descubrimiento-a-cotización está el comprador (Entrada, Calificación, Descubrimiento, Comparación, Señal de intención, Captura de contacto, Cotización). Se reevalúa en cada turno — no es una transición de Estado forzada por el dominio, la Conversación puede volver a una Etapa anterior. Se usa para adaptar el comportamiento del Agente (ej. preguntas abiertas en Descubrimiento vs. cierre incisivo en Señal de intención) y se registra como evento para Analytics.
_Avoid_: estado, fase (para no confundir con Estado de la Conversación).

**Veredicto**:
La recomendación explícita que el Agente entrega al cerrar una comparación: un Vehículo recomendado, el **Campo decisivo** por el que se lo recomienda, y una razón en prosa que explica el trade-off contra el otro Vehículo en los términos que el comprador declaró. Es una salida estructurada del turno, no una frase suelta dentro del mensaje. No siempre existe: si el Perfil no da con qué desempatar, o si la verificación contra los Ganadores de comparación falla, la Conversación sigue sin Veredicto — no se fuerza uno.
_Avoid_: recomendación (demasiado genérico — el Agente sugiere candidatos todo el tiempo sin que eso sea un Veredicto), conclusión, resultado.

**Campo decisivo**:
El campo de la Ficha técnica que sostiene el Veredicto (ej. consumo). Se emite estructurado, no inferido del texto, precisamente para poder verificar que el Vehículo recomendado sea efectivamente el **Ganador de comparación** de ese campo. Si no lo es, el Veredicto se descarta.
_Avoid_: criterio, razón (son la explicación en prosa, no el campo verificable).

## Relationships

- El **Agente** sugiere y compara **Vehículo**s del Catalog, por ID — referencia únicamente, nunca copia datos.
- El **Agente** construye/actualiza un **Perfil** a medida que la **Conversación** avanza — el **Perfil** sigue siendo uno solo por Sesión (acumula entre todas las Conversaciones de esa Sesión, y entre Atajos y texto libre dentro de cada una), aunque puedan existir varias Conversaciones para esa misma Sesión.
- El **Agente** crea un **Lead** (referenciando el **Perfil** vía `profileId`) cuando el comprador deja contacto real.
- El **Agente** publica un evento por cada **Etapa del funnel** alcanzada, consumido por Analytics — mismo patrón que `LeadSubmittedEvent` (ver `docs/adr/0004-leads-analytics-integration-via-domain-event.md`), sin que el Agente sepa que Analytics existe.
- El **Veredicto** cruza dos contextos pero lo orquesta el Agente: los **Ganadores de comparación** los calcula Catalog, el peso de cada campo sale del **Perfil**, y el LLM solo redacta. El código verifica el **Campo decisivo** contra los Ganadores antes de dejar salir el Veredicto — mismo patrón que `CatalogGroundingGuard` usa para los `vehicleId` inventados (INV-1). El LLM redacta; el dominio audita.

## Example dialogue

> **Dev:** "Si el comprador vuelve a preguntar algo básico después de haber llegado a Señal de intención, ¿la Conversación retrocede de Etapa?"
> **Domain expert:** "Sí, sin problema — la Etapa no es un estado forzado, es la lectura del Agente en ese momento. Lo que no cambia es el Estado: sigue ACTIVA."

## Flagged ambiguities

- El consumo de tokens (input/output/cached) de las llamadas al LLM es telemetría de infraestructura, no un concepto de dominio ni un Evento de Analytics — se resolvió explícitamente no mezclarlo con el Dashboard de Analytics (comportamiento de comprador). **Resuelto (CEB-46)**: logs estructurados vía `Logger` de NestJS (`VertexLlmUsage`), sin Command/Query/Aggregate. Si más adelante hace falta un dashboard de costos real, se revisa — hoy el log ya es consultable.
- Qué comportamiento específico corresponde a cada Etapa (tono, tipo de pregunta, nivel de insistencia) debe basarse en estándares estudiados de flujos de venta, no inventarse — **resuelto**: el estándar es **"A nadie se le deja esperando" (JFS, agosto 2026)**, el documento de estandarización del piso de ventas. De ahí salen las seis preguntas, la definición de **Calificación** (ver `profile/CONTEXT.md`) y la cardinalidad de **Lead** (ver `leads/CONTEXT.md` y ADR-0013). Lo que el estándar NO define es el comportamiento por Etapa del funnel: sus seis momentos (llega el cliente → primer contacto → prueba de manejo → cotización → objeción/cierre → pérdida) son del proceso comercial completo, no del recorrido conversacional. Las dos clasificaciones conviven y no hay que forzarlas a coincidir.
- **Resuelto (CEB-43)**: cómo se infiere la Etapa — heurística determinista sobre `Profile`/`Conversation` (`inferFunnelStage`), sin interpretar texto libre. El **Turno** sí quedó modelado como concepto de dominio con esta slice: tiene `intentSignal` opcional (`EXPLORATORIO | DECISIVO`), producido por el LLM real (CEB-42) — con el adapter stub de CEB-38 siempre es `null`, así que el retroceso de Etapa entre turnos solo se observa en la práctica una vez que exista el adapter real. El **Mensaje** en sí (contenido libre de cada Turno) sigue sin modelarse como concepto propio — es solo un string.
- El gate de INV-4 (`assertCanRequestContact`) usa un criterio deliberadamente más simple que la Etapa completa (solo presupuesto + necesidad) — es un concepto hermano, no el mismo cálculo, para no atar la garantía dura del invariante a la clasificación de 4 etapas (que sí puede seguir cambiando/afinándose sin tocar el gate). **Reafirmado (CEB-69)**: con el Contacto viviendo en el Perfil (ADR-0012), el gate dejó de gobernar si el contacto se **guarda** y quedó gobernando solo si el Agente lo **pide**. Se evaluó mudarlo a la Etapa del funnel para tener un concepto en vez de dos hermanos, y se descartó: `inferFunnelStage` depende de `intentSignal`, que lo produce el LLM, y un invariante que depende de que el modelo diga la palabra correcta no es un invariante. El nombre se conserva porque ahora describe exactamente lo que hace.
- **Resuelto**: la Etapa del funnel dejó de ser solo para logging — ahora se calcula ANTES de llamar al LLM (sobre el estado previo a este turno) y se le pasa junto con un resumen del Perfil acumulado, para que el Agente pregunte activamente lo que falta (necesidad/motivación/objeciones) mientras esté en Entrada/Descubrimiento, en vez de repetir lo que ya sabe. La Etapa que se loguea en `FunnelStageReachedEvent` sigue siendo la de DESPUÉS del turno (para Analytics) — son dos cálculos distintos con el mismo `inferFunnelStage`, uno antes y otro después.
- **Resuelto (CEB-36-UI-01)**: hasta esta slice, nada disparaba nunca las transiciones de Estado — una Conversación quedaba `ACTIVA` para siempre. Ahora: omitir `conversationId` en `SendMessageCommand` siempre abandona la `ACTIVA` previa de la sesión (si hay una) antes de crear la nueva (`resolveConversation`), y crear un Lead desde la Conversación la marca `COMPLETADA`. Con esto, "la Conversación activa de una Sesión" resuelve siempre a lo sumo una — invariante de aplicación, no de base de datos (ver `docs/adr/`, no ameritó ADR propio por no ser una decisión difícil de revertir).
- **Resuelto (CEB-44)**: el Agente captura datos en Perfil llamando directamente sus comandos/aggregate (vía `findOrCreateProfile`, no por `CommandBus`) — los buses de NestJS/CQRS sí se comparten entre módulos que importan `CqrsModule` (confirmado empíricamente), pero para una escritura síncrona dentro de la misma ejecución de `SendMessageCommand` la llamada directa es más simple y explícita. Esto significa que el puerto `LlmPort` (`ExtractedNeed`/`ExtractedMotivation`/`ExtractedObjection`) reusa los tipos de categoría de `profile/domain/profile.aggregate.ts` en vez de duplicarlos — una excepción deliberada al patrón "referenciar solo por ID" que usan Leads/Analytics hacia Catalog, justificada porque acá Agent construye datos nuevos con la forma exacta que Profile espera, no una referencia a algo ya existente.
