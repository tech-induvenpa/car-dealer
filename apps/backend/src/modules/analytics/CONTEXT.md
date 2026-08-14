# Analytics

Registra comportamiento anónimo (vistas, comparaciones, quiz, leads) y sirve el dashboard agregado del admin panel. Downstream de Catalog y de Leads — nunca al revés.

## Language

**Evento**:
Un hecho puntual de comportamiento anónimo (vehículo visto, agregado a comparación, comparación realizada, quiz completado, lead enviado) — de solo escritura, nunca se modifica después de creado.
_Avoid_: log, registro (demasiado genéricos).

**Sesión (anónima)**:
Un ID aleatorio generado en el navegador y persistido ahí, usado para correlacionar los Eventos de un visitante sin identificarlo personalmente. Ausente en el Evento de Lead enviado (se crea del lado del servidor a partir de `LeadSubmittedEvent`, que no la lleva — ver ADR-0008).
_Avoid_: usuario (no hay login en el lado público), visitante (vale en prosa, no como nombre de campo).

**Par comparado**:
Dos Vehículos que aparecieron juntos en el mismo Evento de comparación — la unidad que se cuenta para responder "qué vehículos se comparan más entre sí".
_Avoid_: combinación, match.

**Dashboard**:
El read-model agregado (top vistos, top comparados, pares frecuentes, leads por marca/vehículo) que consume el admin panel — se calcula al leer, no es una tabla mantenida aparte en el MVP.
_Avoid_: reporte (sugiere algo exportado/programado; esto es en vivo).

## Relationships

- Un **Evento** referencia opcionalmente uno (eventos de un solo vehículo) o varios **Vehículo** (eventos de comparación) — siempre por ID, nunca copia datos de Catalog.
- Un **Evento** de lead enviado se crea de forma reactiva, a partir del `LeadSubmittedEvent` que publica Leads — Analytics es downstream de Leads, nunca al revés.

## Example dialogue

> **Dev:** "¿Contamos un Evento de vista cada vez que la tarjeta del vehículo aparece en la grilla del catálogo?"
> **Domain expert:** "No, sería ruido — un Evento de vista solo se registra cuando alguien entra a la ficha completa de un Vehículo."

## Flagged ambiguities

- Se discutió si el Evento de Lead enviado debía llevar Sesión (para correlacionar el Lead con la navegación previa) — resuelto: no, Leads no va a empezar a cargar `sessionId` solo para servirle a Analytics (ver ADR-0008). Revisar si en el futuro se necesita esa correlación.
