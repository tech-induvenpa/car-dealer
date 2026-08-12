# Leads

Captura el interés de un comprador al final de una comparación. Es downstream de Catalog (referencia Vehículos por ID) y upstream de Analytics (publica el evento que Analytics escucha).

## Language

**Lead**:
El contacto de un comprador (nombre, apellido, teléfono) enviado al cerrar una comparación, junto a los Vehículos que estaba comparando en ese momento.
_Avoid_: prospecto, cliente (todavía no es un cliente), cotización (esa es la acción, no el registro).

**Comparación asociada**:
El set de 2 a 4 IDs de Vehículo que el comprador tenía en pantalla al enviar el Lead — es una foto del momento, no una referencia viva a "lo que esté comparando ahora".
_Avoid_: carrito, selección.

**Estado del Lead**:
El progreso del seguimiento comercial de un Lead por parte del Administrador de catálogo: `NUEVO` (al crear) → `CONTACTADO` → `CONVERTIDO` / `DESCARTADO`. Solo avanza — nunca vuelve a un estado anterior, y `CONVERTIDO`/`DESCARTADO` son finales. Es lo único que cambia después de creado un Lead; el nombre/teléfono/Comparación asociada nunca se editan.
_Avoid_: etapa, pipeline (es el concepto técnico detrás, "Estado" es el término de dominio).

## Relationships

- Un **Lead** referencia uno o más **Vehículo** (por ID, desde Catalog) — en la práctica entre 1 y 4, siguiendo la regla del comparador, aunque el dominio solo exige al menos 1.
- Enviar un **Lead** dispara un `LeadSubmittedEvent`, consumido por Analytics — Leads no depende de Analytics ni sabe que existe.
- Un **Lead** tiene exactamente un **Estado del Lead**, que solo el Administrador de catálogo cambia manualmente.

## Example dialogue

> **Dev:** "Si el visitante compara 4 autos pero saca uno antes de cotizar, ¿el Lead guarda los 4 o los 3 que quedaron?"
> **Domain expert:** "Los que estén en la comparación al momento de enviar el formulario — no arrastra el historial completo de la sesión."

## Flagged ambiguities

- Se discutió (y se descartó para el MVP) agregar más campos demográficos al Lead — resuelto: solo nombre, apellido, teléfono, para minimizar fricción. Revisar con datos reales antes de sumar campos.
