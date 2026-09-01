# Profile (Perfil de Cliente)

Acumula lo que se sabe de un comprador — necesidad, motivación, objeciones y presupuesto — construido incrementalmente por el Wizard y el Agente conversacional. Existe de forma anónima, independiente de que llegue a generarse un Lead.

## Language

**Perfil**:
Entidad con ID propio que acumula Necesidad, Motivación, Objeción y Presupuesto de un comprador. Existe de forma anónima (correlacionado por `sessionId`, como atributo — no como su identidad) antes de que haya contacto real.
_Avoid_: cliente (todavía no es un cliente), lead (concepto vecino, no el mismo — un Perfil puede existir sin Lead).

**Necesidad**:
El tipo de uso o vehículo que busca el comprador — categoría cerrada (para poder agregar patrones) + detalle en texto libre.
_Avoid_: interés, preferencia.

**Motivación**:
Por qué el comprador está considerando comprar ahora — categoría cerrada + detalle en texto libre. Solo el Agente conversacional puede capturarla; el Wizard no tiene forma de preguntarla.
_Avoid_: intención (se confunde con la señal de intención capturada en general, que es más amplia que solo la motivación).

**Objeción**:
Una duda o resistencia expresada por el comprador (ej. precio, financiamiento, marca) — categoría cerrada + detalle en texto libre. Solo el Agente conversacional puede capturarla.
_Avoid_: duda, pregunta (demasiado genéricos — no toda pregunta es una Objeción).

**Presupuesto (rango)**:
Un rango de precio (piso y techo) que el comprador puede/quiere pagar, en la misma forma sin importar la ruta de origen: el Wizard solo captura un tope (se normaliza a rango con piso 0), el Agente puede capturar el rango completo.
_Avoid_: precio, presupuesto a secas (sin dejar claro que es un rango, no un valor único).

## Relationships

- Un **Perfil** se identifica por un ID propio — no reutiliza el `sessionId` de Analytics como su clave primaria, solo lo guarda como atributo de correlación anónima.
- Un **Perfil** se nutre tanto del **Wizard** (Necesidad como categoría de uso + Presupuesto tope) como del **Agente conversacional** (única ruta capaz de capturar Motivación y Objeción) — sus campos son individualmente opcionales según qué ruta lo alimentó.
- Un **Lead** puede referenciar un **Perfil** por `profileId` (nullable) — solo cuando el comprador dejó contacto real. Sin esa referencia, el Perfil permanece anónimo y no correlacionable con una persona identificada.
- **Perfil** publica eventos de dominio en momentos clave (ej. Presupuesto capturado, Objeción registrada) que Analytics consume para patrones agregados — mismo patrón que `LeadSubmittedEvent` (ver `docs/adr/0004-leads-analytics-integration-via-domain-event.md`), sin que Perfil sepa que Analytics existe.

## Example dialogue

> **Dev:** "Si el comprador nunca deja su teléfono pero después llega al concesionario, ¿cómo sabemos que es la misma persona?"
> **Domain expert:** "No lo sabemos — sin que exista un Lead no hay forma de correlacionar. El Perfil anónimo sirve para patrones generales de comportamiento, no para reconocer a esa persona específica en piso."

## Flagged ambiguities

- Se discutió correlacionar Perfiles anónimos por IP del dispositivo — descartado: NAT/redes compartidas lo hacen poco confiable, y ya existe el patrón de `sessionId` anónimo en `localStorage` que Analytics usa para lo mismo (ver `analytics/CONTEXT.md`).
- No está confirmado si Perfil reutiliza literalmente el mismo valor de `sessionId` (`car-dealer-session-id` en `localStorage`) que ya usa Analytics, o si genera su propio identificador anónimo independiente — a confirmar con el equipo técnico.
