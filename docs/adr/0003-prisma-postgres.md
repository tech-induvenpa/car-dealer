# Prisma sobre TypeORM, PostgreSQL como base de datos

Se eligió Prisma en vez de TypeORM —la opción más asociada por defecto a NestJS— porque `schema.prisma` como fuente única de verdad y el client generado dan tipos/autocompletado sin esfuerzo, y `prisma migrate dev` es más predecible que el sync de relaciones de TypeORM. Prioridad: velocidad de un equipo chico construyendo un admin panel CRUD-heavy. PostgreSQL por sus arrays nativos (usados en `highlights` de Vehicle y `vehicleIds` de AnalyticsEvent) y tipo `numeric` para precio.
