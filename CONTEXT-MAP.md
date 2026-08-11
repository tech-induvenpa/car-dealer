# Context Map

Bounded contexts del backend de car-dealer. Ver `PRODUCT-MAP.md` para la vista de negocio.

## Contexts

- [Catalog (Vehicles)](./apps/backend/src/modules/vehicles/CONTEXT.md) — dueño del catálogo de vehículos y su ficha técnica
- [Leads](./apps/backend/src/modules/leads/CONTEXT.md) — captura el contacto de un comprador junto a los vehículos que comparaba
- [Analytics](./apps/backend/src/modules/analytics/CONTEXT.md) — registra comportamiento y sirve el dashboard agregado
- [Identity](./apps/backend/src/modules/auth/CONTEXT.md) — autentica a los usuarios del admin panel

## Relationships

- **Catalog → Leads** (upstream/downstream): Leads referencia `Vehículo` solo por ID — nunca copia ni muta datos de Catalog.
- **Catalog → Analytics** (upstream/downstream): mismo patrón — los eventos cargan `vehicleId`/`vehicleIds` por referencia.
- **Leads → Analytics** (integración por eventos, no dependencia directa): Leads publica `LeadSubmittedEvent`; Analytics lo escucha y registra un evento `LEAD_SUBMITTED`. Leads no sabe que Analytics existe.
- **Identity** no tiene dependientes de dominio — se consume desde el borde de aplicación/infraestructura (`JwtAuthGuard`), no por acoplamiento de dominio.

## Layout físico

Los cuatro contextos viven hoy dentro de una sola app NestJS (`apps/backend`) como módulos separados, no como servicios independientes — es un monolito con límites explícitos: cada módulo respeta internamente las capas domain/application/infrastructure (ver convenciones del skill `ddd-hexa`), así que si algún contexto necesita extraerse a su propio servicio más adelante (ej. Analytics bajo alto volumen de escritura), el límite ya está trazado en el código.
