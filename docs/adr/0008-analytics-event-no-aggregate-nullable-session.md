# AnalyticsEvent sin aggregate, sessionId nullable

`AnalyticsEvent` no extiende `AggregateRoot`: nunca cambia de estado después de creado y no dispara eventos propios (es el final de la cadena de integración — Leads publica, Analytics consume, nadie escucha a Analytics), así que la maquinaria `apply()`/`commit()` no aporta nada. Sí conserva una validación real de creación (`AnalyticsEvent.create()`, estilo VO): cada `type` exige campos distintos (`VEHICLE_VIEWED` necesita `vehicleId`, `COMPARISON_PERFORMED` necesita `vehicleIds`, etc.).

`sessionId` es nullable y queda ausente en el Evento `LEAD_SUBMITTED` (creado reactivamente desde `LeadSubmittedEvent`, que no lo lleva en su payload). Se decidió no hacer que Leads empiece a cargar `sessionId` para que Analytics pueda correlacionarlo, porque eso rompería la independencia ya establecida en `CONTEXT-MAP.md` ("Leads no depende de que Analytics exista") a cambio de un valor de negocio no confirmado — ninguna métrica actual del Dashboard necesita esa correlación.

## Consequences

- Si en el futuro hace falta correlacionar un Lead con la sesión de navegación que lo originó, hay que revisar esta decisión — hoy esa relación simplemente no existe en los datos.
