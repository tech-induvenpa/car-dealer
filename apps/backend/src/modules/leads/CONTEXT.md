# Leads

Captura el interés de un comprador al final de una comparación. Es downstream de Catalog (referencia Vehículos por ID) y upstream de Analytics (publica el evento que Analytics escucha).

## Language

**Lead**:
El interés de un comprador concreto en **un Vehículo concreto**: nombre, apellido, teléfono y un solo Vehículo. La misma persona puede tener **varios Leads abiertos a la vez**, uno por cada carro que le interesa.
Es el mismo concepto que la **Oportunidad** del estándar de ventas de JFS ("A nadie se le deja esperando", ago 2026). Se conserva el nombre Lead porque es el que ya vive en el código y en el panel; lo que se adoptó del estándar es su cardinalidad.
Antes un Lead llevaba de 2 a 4 Vehículos, una foto de lo que el comprador tenía en pantalla. Se cambió porque un Lead con un RAV4 y un Sportage **pertenece a dos concesionarios distintos** y empaquetado ninguno de los dos lo ve limpio; y porque el estándar cuenta Oportunidades, así que con Leads multi-vehículo las cifras de las dos partes no se pueden sumar.
_Avoid_: prospecto, cliente (todavía no es un cliente), cotización (esa es la acción, no el registro), y **"el Lead de Ana"** — Ana puede tener tres.

**Origen del Lead**:
Cómo nació ese interés: el **Veredicto** lo recomendó, era **el otro lado** de la comparación, o el comprador lo **pidió** explícitamente. Es el registro de un hecho, no una escala de calor.
Se evaluó llamarlo "temperatura" y se descartó: una escala invita a inventar gradaciones que nadie puede defender, y un número que existe se usa aunque no esté validado. Qué origen cierra mejor se **mide con los datos** cuando los haya, no se declara de antemano.
_Avoid_: temperatura, prioridad, score, calificación del Lead (sugieren una escala; y "Calificación" ya significa otra cosa en el estándar).

**Estado del Lead**:
El progreso del seguimiento comercial de un Lead por parte del Administrador de catálogo: `NUEVO` (al crear) → `CONTACTADO` → `CONVERTIDO` / `DESCARTADO`. Solo avanza — nunca vuelve a un estado anterior, y `CONVERTIDO`/`DESCARTADO` son finales. Es lo único que cambia después de creado un Lead; el nombre/teléfono/Comparación asociada nunca se editan.
_Avoid_: etapa, pipeline (es el concepto técnico detrás, "Estado" es el término de dominio).

## Relationships

- Un **Lead** referencia **exactamente un Vehículo** (por ID, desde Catalog). Una conversación que termina interesando al comprador en dos carros produce **dos Leads**, cada uno con su propio Estado y su propio seguimiento — porque cada uno es una venta distinta, posiblemente en un concesionario distinto.
- Un **Lead** tiene exactamente un **Origen del Lead**, fijado al crearlo y nunca editado.
- Enviar un **Lead** dispara un `LeadSubmittedEvent`, consumido por Analytics — Leads no depende de Analytics ni sabe que existe.
- Un **Lead** tiene exactamente un **Estado del Lead**, que solo el Administrador de catálogo cambia manualmente.
- Un **Lead** puede referenciar opcionalmente un **Perfil** (por `profileId`, nullable, ver `profile/CONTEXT.md`) — presente solo si el Lead se originó desde el Agente conversacional; un Lead del formulario de la vista de par (camino del visitante frío) queda con `profileId = null`. Es una referencia por ID igual que con Vehículo, no reabre la decisión de no agregar campos demográficos al Lead (ver Flagged ambiguities).

## Example dialogue

> **Dev:** "Si el visitante compara 4 autos pero saca uno antes de cotizar, ¿el Lead guarda los 4 o los 3 que quedaron?"
> **Domain expert:** "Los que estén en la comparación al momento de enviar el formulario — no arrastra el historial completo de la sesión."

## Flagged ambiguities

- Se discutió (y se descartó para el MVP) agregar más campos demográficos al Lead — resuelto: solo nombre, apellido, teléfono, para minimizar fricción. Revisar con datos reales antes de sumar campos.
- Esa decisión no aplica a `profileId`: es un puntero al contexto Perfil de Cliente, no un campo demográfico que el comprador tenga que llenar — no agrega fricción al formulario de Lead.
- Un Lead llevaba de 2 a 4 Vehículos ("Comparación asociada") — **resuelto**: pasa a llevar uno solo, por la cardinalidad de Oportunidad del estándar. Queda sin resolver **contra qué se comparó**: en el camino conversacional se recupera de la Conversación, pero un Lead del formulario de la vista de par no tiene Conversación detrás y ahí esa información se pierde. Revisar si al equipo comercial le sirve saberlo o si con el Origen alcanza.
