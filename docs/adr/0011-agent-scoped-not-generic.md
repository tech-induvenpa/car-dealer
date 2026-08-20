# Agent acotado al descubrimiento de vehículos, no genérico

El nuevo contexto Agent (agente conversacional) se modela acotado al dominio de descubrimiento y venta de vehículos — no como un motor de conversación genérico reusable para otros casos de uso (se mencionó un posible agente futuro de ayuda para planillas de crédito, pero es una idea especulativa, no un requisito confirmado — ver `apps/backend/src/modules/profile/CONTEXT.md`). La reutilización futura para otros casos de uso, si se concreta, pasa por infraestructura compartida (adapters de proveedor LLM, de canal) vía Hexagonal — no por generalizar el modelo de dominio de este contexto ahora. Esto evita diseñar contra un caso hipotético a costa de ensuciar el lenguaje de este contexto con conceptos (ej. aprobación crediticia) que no existen todavía.

Como parte de este alcance, el Agente nunca debe salir del contexto del funnel de descubrimiento/venta de vehículos — debe ser resiliente a tests adversariales/prompt injection, rechazando cualquier pregunta o solicitud fuera de ese alcance (ver Business Rules del PRD, CEB-35). Este invariante debe codificarse explícitamente en el system prompt del Agente, no dejarse implícito ni delegado solo a un filtro posterior.

Dado que el system prompt va a cargar ese invariante de alcance como contenido estable (igual en cada llamada), la estructura del prompt debe optimizarse para aprovechar el cache de prompts del proveedor LLM: el contenido estático/invariante (reglas de alcance, instrucciones de comportamiento por Etapa del funnel) va como prefijo fijo, y el contenido dinámico (historial de la Conversación, Perfil acumulado hasta el momento) va después — para no invalidar el cache en cada turno.

## Consequences

- Si en el futuro se concreta un caso de uso genérico (ej. agente de crédito), hay que revisar esta decisión — hoy el modelo de dominio de Agent no está preparado para reusarse tal cual, solo su infraestructura.
- El orden y la estabilidad del contenido del system prompt pasan a ser parte del contrato de implementación, no un detalle libre — cualquier cambio a las reglas de alcance/etapa debe evaluarse también por su impacto en la tasa de cache-hit, no solo por su contenido.
