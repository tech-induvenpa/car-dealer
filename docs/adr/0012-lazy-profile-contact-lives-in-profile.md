# Perfil perezoso: se crea al primer dato declarado, y el Contacto vive en él

El Perfil deja de crearse en cada turno del Agente y pasa a crearse **solo cuando hay algo declarado que guardar** — la primera Necesidad, Motivación, Objeción, Presupuesto o Contacto que el comprador ofrezca. Y el **Contacto** (nombre, apellido, teléfono) pasa a ser un dato declarado más que vive en el Perfil, en vez de esperar en otro lado hasta que se pueda crear un Lead.

Las dos decisiones van juntas porque se sostienen mutuamente. Hasta ahora `findOrCreateProfile` corría en cada `SendMessageCommand` antes siquiera de llamar al LLM, así que cualquiera que mandara un mensaje y se fuera dejaba una fila de puros nulls. Esa fila no aportaba nada: la correlación por sesión que ofrecía ya existe en Analytics y en Conversación. Con creación perezosa **todo Perfil es de alguien que eligió contar algo**, y por lo tanto guardar ahí el Contacto no mezcla poblaciones distintas — es un grado más de lo mismo, no una categoría nueva.

Esto exigió deshacer una afirmación que arrastraba el contexto: que el Perfil "existe de forma anónima". Al revisarlo, esa anonimidad era **descriptiva, no prescriptiva** — no había ADR ni razonamiento que la sostuviera, y la única discusión registrada sobre correlacionar Perfiles (hacerlo por IP) se había descartado por poco confiable con NAT, no por privacidad. Es decir: nunca hubo una política de que el Perfil no pudiera identificarse, solo la constatación de que todavía no lo estaba.

La distinción que evita que esto se vuelva a confundir: **lo que el comprador declaró vive en el Perfil; lo que ocurrió vive en la Conversación; lo agregado, en los Eventos de Analytics.** El Perfil no es la bitácora de la interacción, y por eso no hace falta uno para que la interacción de un visitante quede observable.

## Alternativas consideradas

- **El Contacto huérfano espera en la Conversación** hasta que aparezca un Vehículo y se pueda crear el Lead. Descartada: también pone datos personales en una tabla que no es Lead, así que no preserva ninguna frontera — y encima una Conversación es un hilo de mensajes, no "lo que sabemos del comprador". El concepto no le calza.
- **Crear el Lead de inmediato, sin Vehículos.** Descartada por producto: llena el panel de comercial de contactos sin contexto, que es justo lo que hace que un equipo de ventas deje de mirar el panel.

## Consequences

- `inferFunnelStage`, `buildProfileSummary` y `assertCanRequestContact` deben aceptar un Perfil ausente. Semánticamente no cambia nada: sin Perfil no hay calificación posible, que es exactamente lo que hoy calculan con un Perfil vacío.
- Un Perfil con Contacto pero sin Lead es un estado normal y esperado, no una inconsistencia: el Lead exige al menos un Vehículo (ver `leads/CONTEXT.md`), así que el Contacto ofrecido antes de hablar de vehículos se guarda y el Lead se materializa después.
- El `profileId` nullable del Lead indica **origen, no anonimidad** — presente si el Lead nació de una Conversación, ausente si vino del Wizard. `profile/CONTEXT.md` afirmaba lo contrario y contradecía a `CONTEXT-MAP.md`; quedó corregido.
- Un pedido de "borren mis datos" toca Perfil y Lead, no solo Lead. A cambio, los Perfiles que hay que revisar son muchos menos que antes, porque ya no existe uno por visitante.
- Queda sin resolver, y ahora importa más, la ambigüedad ya registrada sobre si el Perfil reutiliza el mismo `sessionId` de `localStorage` que Analytics o genera el suyo.
