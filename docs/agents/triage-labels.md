# Triage Labels

Los skills hablan en términos de cinco roles de triage canónicos. Este archivo mapea esos roles a los strings de label reales usados en el tracker de este repo (Linear, Team JFS).

| Label en mattpocock/skills | Label en nuestro tracker | Significado                              |
| --------------------------- | ------------------------- | ----------------------------------------- |
| `needs-triage`               | `needs-triage`             | El maintainer necesita evaluar el issue   |
| `needs-info`                 | `needs-info`               | Esperando más información del reportante  |
| `ready-for-agent`            | `ready-for-agent`          | Completamente especificado, listo para un agente AFK |
| `ready-for-human`            | `ready-for-human`          | Requiere implementación humana            |
| `wontfix`                    | `wontfix`                  | No se va a resolver                       |

Cuando un skill menciona un rol (ej. "aplicar la label de listo-para-agente"), usar el string correspondiente de esta tabla.

**Pendiente**: estas labels todavía no existen en el workspace de Linear (Team JFS) — hay que crearlas antes de que los skills de triage puedan aplicarlas.

## Product ↔ Tech handoff labels

Labels adicionales para el traspaso entre producto y tech (usadas por `grill-product`, `to-product-prd`, `to-prd --enrich`), creadas en Linear Team JFS:

| Label | Significado |
| ----- | ----------- |
| `ready-for-tech-review` | PRD de producto completo; tech debe revisarlo y enriquecerlo |
| `product-feedback-required` | Tech encontró un gap; producto debe aclarar antes de que siga el enriquecimiento |
