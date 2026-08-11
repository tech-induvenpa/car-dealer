# Catalog (Vehicles)

Dueño del catálogo de vehículos del holding: cada entrada es una ficha técnica completa y comparable. Es el contexto upstream — Leads y Analytics lo referencian, nunca al revés.

## Language

**Vehículo**:
Una entrada específica marca+modelo+versión+año con su ficha técnica completa — no una familia de modelos.
_Avoid_: Modelo (ambiguo, es solo un campo del Vehículo), Auto, Carro.

**Ficha técnica**:
El conjunto estructurado de specs (motor, dimensiones, consumo, seguridad, confort, garantía) que trae cada Vehículo.
_Avoid_: specs, detalles.

**Versión / Trim**:
La configuración específica de un modelo (ej. "Premium AWD") que junto a modelo+año identifica a un Vehículo.
_Avoid_: submodelo.

**Precio todo-incluido**:
El único campo de precio (USD) del Vehículo — ya incluye IVA, IGTF, matriculación, gastos operativos, etc. No hay desglose estructurado en el MVP.
_Avoid_: precio base, precio de lista (sugieren que existe un desglose, y no existe todavía).

**Destacados**:
Lista libre de features que no aplican parejo a todos los vehículos (ej. "Sunroof eléctrico") — separada de los campos estructurados de la ficha técnica.
_Avoid_: features, highlights.

**Categoría**:
El tipo de carrocería del vehículo (SUV, Sedán, Pickup, etc.) — se usa para avisar de comparaciones dispares, no para restringirlas.
_Avoid_: tipo, segmento.

**Archivar**:
Sacar un Vehículo del catálogo público (`isPublished = false`) sin borrar el registro — preserva la integridad de los Leads y Eventos de Analytics que lo referencian.
_Avoid_: borrar, eliminar (implican hard-delete, que este contexto nunca hace).

## Relationships

- Un **Vehículo** tiene exactamente una **Ficha técnica** (embebida, no es un aggregate separado).
- Un **Vehículo** pertenece a una **Marca** (Toyota/Kia/Changan) y una **Categoría**.
- **Leads** y **Eventos de Analytics** referencian a un **Vehículo** solo por ID — Catalog nunca depende de ellos.

## Example dialogue

> **Dev:** "¿El 'CS35 Plus' es un Vehículo, o es un Modelo con varios Vehículos adentro por cada versión?"
> **Domain expert:** "Cada versión es su propio Vehículo. 'CS35 Plus' a secas no se puede cargar — necesitás la entrada completa: Changan CS35 Plus 2024, con su propia ficha técnica y precio."

## Flagged ambiguities

- El **Precio** se discutió inicialmente como posible desglose (IVA, matriculación, etc. por separado) — resuelto: un solo campo todo-incluido + texto libre "incluye", sin desglose estructurado en el MVP.
