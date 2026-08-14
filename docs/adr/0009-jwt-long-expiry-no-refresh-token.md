# Sesión admin: JWT de 30 días en vez de refresh token

ADR-0007 ya anticipaba este momento ("revisar esto el día que se necesite revocar sesiones antes de las ~24h de expiración"). Ese día llegó al diseñar el admin panel: un JWT de 24h corría el riesgo real de expirar a mitad de una carga larga (la ficha técnica de un Vehículo tiene 30+ campos), perdiendo el trabajo del Administrador de catálogo. Se evaluó un refresh token con estado en BD (tabla revocable, rotación en cada uso, detección de reuso) y se descartó por ahora — demasiada robustez para el volumen y riesgo real de un panel interno de bajo tráfico en este MVP. Se optó por extender el JWT a 30 días, sin refresh token ni tabla nueva: sigue siendo stateless, solo que la ventana es mucho más generosa. La pérdida de trabajo residual (token vence a mitad de un formulario) se mitiga aparte con un autosave del formulario a `localStorage`, no con lógica de sesión.

## Consequences

- Un JWT robado es válido hasta 30 días sin forma de revocarlo antes de tiempo — aceptable dado que es un panel interno de un solo rol admin, sin datos de pago ni PII sensible de terceros más allá de nombre/teléfono de Leads.
- Si more adelante se necesita revocación real (ej. más de un AdminUser, algún incidente de seguridad), la migración a un refresh token con estado sigue siendo la vía — este ADR no la descarta, solo la difiere.
