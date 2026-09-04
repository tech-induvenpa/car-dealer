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

**Veredicto entregado**:
Evento propio, distinto de comparación realizada: registra que el Agente llegó a recomendar un Vehículo y que esa recomendación pasó la verificación contra los Ganadores de comparación. Es el criterio de éxito del pivote conversacional. Se separa de la comparación a propósito — el Agente puede contrastar un par y **no** llegar a Veredicto (ver regla del Agente: sin ganador claro no hay Veredicto), así que una comparación realizada no implica un Veredicto entregado.
_Avoid_: recomendación, conversión (esto no es todavía un Lead).

**Dashboard**:
El read-model agregado (top vistos, top comparados, pares frecuentes, leads por marca/vehículo) que consume el admin panel — se calcula al leer, no es una tabla mantenida aparte en el MVP.
_Avoid_: reporte (sugiere algo exportado/programado; esto es en vivo).

## Relationships

- Un **Evento** referencia opcionalmente uno (eventos de un solo vehículo) o varios **Vehículo** (eventos de comparación) — siempre por ID, nunca copia datos de Catalog.
- Un **Evento** de lead enviado se crea de forma reactiva, a partir del `LeadSubmittedEvent` que publica Leads — Analytics es downstream de Leads, nunca al revés.

- Un **Evento** de comparación realizada tiene **dos emisores** con calidad de dato distinta: el Agente lo publica como evento de dominio (server-side, confiable, mismo patrón que `LeadSubmittedEvent` — ver ADR-0004), y el camino del visitante frío lo emite desde el navegador, deliberadamente fire-and-forget (`trackEvent` no devuelve promesa y se traga el error para no romperle la experiencia al visitante). La asimetría entonces no es "servidor contra cliente" sino **escritura transaccional contra un POST diseñado para fallar callado**: una comparación del camino frío que no llegue al backend se pierde sin reintento y sin dejar rastro de que se perdió. No se unificaron porque en el camino frío el único momento de servidor es una Query, y una Query que publica eventos rompe CQRS. Al leer la métrica agregada conviene recordar que sus dos mitades no son igual de confiables.
- Un **Evento** de veredicto entregado lo publica siempre el Agente como evento de dominio — nunca el navegador.

## Example dialogue

> **Dev:** "¿Contamos un Evento de vista cada vez que la tarjeta del vehículo aparece en la grilla del catálogo?"
> **Domain expert:** "No, sería ruido — un Evento de vista solo se registra cuando alguien entra a la ficha completa de un Vehículo."

## Flagged ambiguities

- Se discutió si el Evento de Lead enviado debía llevar Sesión (para correlacionar el Lead con la navegación previa) — resuelto: no, Leads no va a empezar a cargar `sessionId` solo para servirle a Analytics (ver ADR-0008). Revisar si en el futuro se necesita esa correlación.
- El evento **agregado a comparación** queda huérfano con el pivote conversacional (CEB-69): muere la bandeja de comparación, así que nada vuelve a dispararlo — resuelto: **el valor del enum se conserva** y simplemente deja de emitirse. Hay Eventos históricos en la base que lo referencian, y borrar el valor rompería su lectura. Mismo criterio que **Archivar** en Catalog: no se hace hard-delete de algo que otros registros apuntan.
- Se propuso aprender **qué le importa a cada tipo de comprador** para decidir qué mostrar primero en la ficha comercial. Tres precisiones para cuando se retome: **(1)** no es un campo del Perfil — un modelo de pesos por Perfil individual es n=1 y no aprende nada; el valor está en el **agregado** por tipo de comprador, o sea un read-model de este contexto. **(2)** Cruzar `NEED_CAPTURED` con el **Campo decisivo** del Veredicto sale gratis, pero tiene una **trampa de circularidad**: el Agente elige el Campo decisivo sabiendo la Necesidad declarada, porque se la pasan en el prompt — correlacionar las dos mide el prompt propio, no el mercado. **(3)** La señal limpia es el **Atajo desempatador** de la pantalla sin Veredicto ("gastar menos en gasolina" vs. "tener más motor"): ahí el comprador elige un peso, no el modelo lo infiere, y al ser Atajo es determinista. Lo que hoy no existe es granularidad a nivel de spec — `VEHICLE_VIEWED` es de página, no dice qué filas de la ficha miró. **Decidido por ahora (CEB-69): no se agrega instrumentación nueva**; la prioridad es acumular datos con los eventos que ya se emiten.

