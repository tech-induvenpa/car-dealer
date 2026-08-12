# Vehicle: Value Objects solo donde hay invariante real, sin domain events en el MVP

El aggregate `Vehicle` solo envuelve `price` en un Value Object — es el único campo con una invariante real (debe ser positivo). El resto de la ficha técnica (motor, dimensiones, consumo, seguridad, confort) queda como campos primitivos: son datos opcionales sin invariantes cruzadas ni comportamiento propio, envolverlos en VOs sería ceremonia sin payoff. Por la misma razón, `Vehicle` no emite domain events en el MVP — a diferencia de Leads→Analytics (ADR-0004), hoy no existe ningún listener que reaccione a la creación/edición/archivado de un vehículo; el plumbing de `EventPublisher` se agrega el día que aparezca un consumidor real.

## Consequences

- Si surge una invariante cruzada entre campos (ej. `tankCapacityL` no aplica si `fuelType` es ELECTRICO), nace un VO puntual para ese caso — no antes.
- Si aparece un consumidor real de eventos de Catalog (ej. invalidación de caché de búsqueda), se agrega el evento correspondiente sin tocar el resto del aggregate.
