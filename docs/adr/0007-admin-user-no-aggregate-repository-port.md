# AdminUser sin aggregate en el MVP, pero con repository port

`Login` no tiene una invariante de negocio real hoy (verificar un hash de password no amerita un aggregate) — `LoginQueryHandler` trata a `AdminUser` como un tipo plano leído a través de `domain/ports/admin-user.repository.ts`, no como un `AggregateRoot`. Se decidió poner el repository port igual (en vez de que el handler pegue directo a Prisma, como sí hacen las Queries de lectura de Vehicles) porque Login es el punto donde con alta probabilidad va a crecer lógica de dominio real más adelante — lockout por intentos fallidos, roles, estado de suscripción — a diferencia de un listado descartable. El port da un límite ya trazado: ese día se cambia el adapter o se promueve `AdminUser` a una entidad real, sin tocar nada fuera de `modules/auth/`.

## Consequences

- Mientras no haya una invariante real, `AdminUser` sigue siendo un tipo de lectura (`AdminUserRecord`), no una clase con comportamiento — no se fuerza una aggregate vacía.
- El JWT se queda stateless (solo se valida la firma en cada request, no se re-consulta la BD) — revisar esto el día que se necesite revocar sesiones antes de las ~24h de expiración.
