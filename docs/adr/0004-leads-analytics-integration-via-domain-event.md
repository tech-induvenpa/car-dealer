# Leads → Analytics vía domain event, no llamada directa

Cuando se envía un Lead, el evento de analytics `LEAD_SUBMITTED` no lo dispara el frontend ni una llamada directa de `LeadsService` a `AnalyticsService` — Leads publica `LeadSubmittedEvent` y Analytics lo consume con un listener (`@EventsHandler`). Dos razones: evita el doble conteo que ocurriría si el POST del frontend fallara después de mostrarle éxito al usuario, y mantiene a Leads sin ninguna dependencia de que Analytics exista — si Analytics se cae o se extrae a otro servicio más adelante, Leads sigue funcionando igual.
