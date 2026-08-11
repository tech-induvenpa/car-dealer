# DDD + Hexagonal + CQRS en todos los módulos del backend

El backend NestJS se estructura en 4 bounded contexts (Vehicles, Leads, Analytics, Auth), cada uno con capas domain/application/infrastructure, aggregates con `AggregateRoot` de `@nestjs/cqrs`, y todo cambio de estado pasa por un Command y toda lectura por una Query (convenciones del skill `ddd-hexa`). Se adoptó explícitamente incluso en módulos donde el CRUD es simple — Analytics es esencialmente un log de eventos de solo escritura, Auth es una sola entidad sin invariantes de negocio reales — porque el usuario pidió aplicar el estándar de forma consistente en todo el backend, priorizando uniformidad y preparación para escalar/extraer contextos individualmente por sobre la mínima fricción de cada módulo por separado.

## Consequences

- Analytics y Auth cargan con ceremonia (Command/Query/Handler/Port) que un CRUD plano no necesitaría — es complejidad aceptada a cambio de consistencia, no una necesidad orgánica de esos módulos.
- Login se modela como Query, no Command, porque no muta estado persistente en el MVP (sin `lastLoginAt`) — es la única excepción documentada a "todo cambio de estado es un Command".
