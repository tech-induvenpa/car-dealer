# Profile (Perfil de Cliente)

Acumula lo que el comprador **declaró** — necesidad, motivación, objeciones, presupuesto y, si lo ofreció, su contacto. Se construye incrementalmente a medida que el comprador cuenta cosas, y existe independientemente de que llegue a generarse un Lead.

**Lo declarado vive acá; lo que ocurrió vive en la Conversación; lo agregado, en los Eventos de Analytics.** Un visitante que conversa sin declarar nada deja rastro completo en esos otros dos contextos — no necesita un Perfil para que su interacción sea observable.

## Language

**Perfil**:
Entidad con ID propio que acumula lo que el comprador declaró: Necesidad, Motivación, Objeción, Presupuesto y, si lo ofreció, **Contacto**. Se correlaciona por `sessionId` como atributo, no como identidad. **Se crea solo cuando hay algo que guardar** — conversar sin declarar nada no genera Perfil (ver ADR-0012).
Que un Perfil sea anónimo o no es un **atributo que puede cambiar**, no parte de su definición: deja de serlo en el momento en que el comprador ofrece Contacto. La anonimidad nunca fue una política de este contexto, solo la descripción del caso más común.
_Avoid_: cliente (todavía no es un cliente), lead (concepto vecino, no el mismo — un Perfil puede existir sin Lead), registro de sesión (el Perfil no es la bitácora de la interacción — eso es la Conversación).

**Contacto**:
Nombre, apellido y teléfono, cuando el comprador los ofrece. Es un dato declarado más, no una categoría aparte: se guarda apenas se ofrece, sin esperar a que se pueda crear un Lead. Tenerlo es lo que vuelve identificable a un Perfil.
_Avoid_: datos personales (demasiado amplio), lead (un Contacto en el Perfil todavía no es un Lead — falta al menos un Vehículo).

**Atajo**:
Una opción de conjunto cerrado que el comprador tapea en vez de escribir (ej. "Uso familiar", "$20.000 a $35.000"). Su significado lo conoce el sistema de antemano, así que el hecho se captura **de forma determinista, sin pasar por el modelo** — tapear "Uso familiar" fija la Necesidad en esa categoría, no la infiere. Es el mismo mecanismo que antes se llamaba Wizard; cambió dónde se presenta (adentro de la Conversación, no en una página aparte), no cómo captura.
_Avoid_: Wizard (era un formulario paginado, y ya no lo es — el nombre quedó describiendo una UI que no existe), chip, botón (son la forma visual, no el concepto), sugerencia (el Agente sugiere vehículos; un Atajo es una respuesta pre-formulada del comprador).

**Uso**:
Cómo va a ser un día típico del comprador con el carro — categoría cerrada (`CIUDAD | CARRETERA | TRABAJO`, para poder agregar patrones) + el detalle **en sus palabras**. Responde a la primera de las seis preguntas del estándar de ventas de JFS ("A nadie se le deja esperando", ago 2026).
Antes se llamaba **Necesidad** y su categoría era una carrocería (`SUV | COMPACTO | PICKUP`). Eso guardaba **nuestra conclusión en el lugar del dato**: el comprador dice "familiar", nosotros anotábamos "SUV". El estándar es tajante en la dirección contraria —lo que dijo el cliente se anota en sus palabras, no lo que uno cree— y además producía contradicciones falsas: "familiar" y después "para ciudad" no se contradicen (un uso familiar en ciudad es perfectamente coherente), se contradecían nuestras dos conclusiones de carrocería.
La carrocería que sirve para ese uso **no se guarda**: es una inferencia, y nada la consume — el Agente razona sobre el catálogo completo, y el filtro que la necesitaba murió con la página del quiz.
_Avoid_: Necesidad (nombre anterior; describía una conclusión, no lo declarado), categoría, carrocería, tipo de vehículo (eso es **Categoría**, y pertenece a Catalog).

**Acompañantes**:
Quién más va a andar en el carro — categoría cerrada (`FAMILIA | SILLAS_DE_NINO | MASCOTAS | CARGA | NADIE`) + detalle en sus palabras. Segunda de las seis preguntas del estándar.
_Avoid_: pasajeros (es un campo de la Ficha técnica del Vehículo, otra cosa), familia (es solo una de las respuestas posibles).

**Punto de dolor**:
Qué le cambiaría ya mismo al carro que tiene hoy — **en sus palabras**. Tercera de las seis preguntas.
No es lo mismo que una **Objeción**: el punto de dolor es sobre el carro que ya tiene y es la razón por la que está mirando; la Objeción es sobre esta compra y es lo que la frena. Un comprador puede tener punto de dolor sin ninguna objeción, y al revés.
_Avoid_: queja, problema, objeción.

**Innegociable**:
Lo que el comprador no negocia — cuarta de las seis preguntas ("¿qué es indispensable para usted?"). Es el insumo directo del **Campo decisivo** del Veredicto: sin esto, elegir por qué campo recomendar es adivinar.
_Avoid_: preferencia, prioridad (admiten grados; un innegociable no), requisito (suena a formulario).

**Horizonte**:
Para cuándo necesita el carro — la urgencia **real**, no la que uno supone. Quinta de las seis preguntas.
_Avoid_: urgencia, plazo de entrega (eso lo define el concesionario, no el comprador), fecha.

**Forma de pago**:
Contado o crédito. Sexta y última de las seis preguntas. Es la forma de pago que el comprador **piensa** usar, no una aprobación ni un trámite en curso.
_Avoid_: financiamiento (es el producto, no la intención), crédito aprobado (eso es otro estado, del lado del banco).

**Calificación**:
Que el Perfil tenga las cinco cosas que el estándar exige saber **antes de hablar de precios**: Uso, Acompañantes, Presupuesto, Horizonte y Forma de pago. Es un estado derivado del Perfil, no un campo que alguien setea.
Hay una compuerta **más baja** para recomendar —Uso, Presupuesto e Innegociable— porque un Veredicto necesita saber qué le importa, no si puede pagar; y en un chat cada pregunta cuesta un turno. Pedir el contacto sí exige la Calificación completa: ahí es donde el estándar pone la línea.
_Avoid_: lead calificado, scoring, temperatura (ver Origen del Lead en `leads/CONTEXT.md`).

**Motivación**:
Por qué el comprador está considerando comprar ahora — categoría cerrada + detalle en texto libre. Solo se captura por extracción sobre texto libre; no hay Atajo que la pregunte.
No viene del estándar de ventas: es un concepto nuestro, anterior. Se solapa en parte con **Horizonte** (cuándo) pero responde otra cosa (por qué), y las dos se conservan.
_Avoid_: intención (se confunde con la señal de intención capturada en general, que es más amplia que solo la motivación).

**Objeción**:
Una duda o resistencia expresada por el comprador (ej. precio, financiamiento, marca) — categoría cerrada + detalle en texto libre. Solo se captura por extracción sobre texto libre.
_Avoid_: duda, pregunta (demasiado genéricos — no toda pregunta es una Objeción).

**Presupuesto (rango)**:
Un rango de precio (piso y techo) que el comprador puede/quiere pagar, en la misma forma sin importar cómo se haya capturado: un Atajo aporta solo un tope (se normaliza a rango con piso 0), la extracción sobre texto libre puede aportar el rango completo.
_Avoid_: precio, presupuesto a secas (sin dejar claro que es un rango, no un valor único).

## Relationships

- Un **Perfil** se identifica por un ID propio — no reutiliza el `sessionId` de Analytics como su clave primaria, solo lo guarda como atributo de correlación.
- La **Calificación** se deriva del Perfil: no se guarda, se calcula preguntando si están las cinco piezas. Dos reglas distintas la consultan con umbrales distintos — recomendar exige menos que pedir contacto.
- Un **Perfil** se nutre por dos mecanismos que conviven en la misma Conversación: los **Atajos** (Necesidad y Presupuesto, deterministas) y la **extracción del Agente** sobre texto libre (única vía capaz de capturar Motivación y Objeción). Sus campos son individualmente opcionales según qué haya alimentado a cada uno. Cuando un turno trae un Atajo, su hecho se aplica **antes** de que el Agente arme su respuesta — si no, el Agente vuelve a preguntar lo que el comprador acaba de tapear.
- Un **Lead** puede referenciar un **Perfil** por `profileId` (nullable). El nullable indica **origen, no anonimidad**: está presente cuando el Lead nació de una Conversación con el Agente, y ausente cuando vino del formulario de la vista de par — el camino del visitante frío, donde nadie declaró nada y por lo tanto no hay Perfil. (Antes este punto decía que el nullable marcaba "si dejó contacto real", lo cual contradecía a `CONTEXT-MAP.md` y al código — corregido.)
- El **Contacto** vive en el **Perfil**, no esperando en otro lado. Un Perfil con Contacto pero sin **Lead** todavía es normal y esperado: el Lead exige al menos un **Vehículo**, así que si el comprador ofrece su teléfono antes de que se hable de alguno, el Contacto queda guardado y el Lead se materializa en cuanto aparezca el primero.
- **Perfil** publica eventos de dominio en momentos clave (ej. Presupuesto capturado, Objeción registrada) que Analytics consume para patrones agregados — mismo patrón que `LeadSubmittedEvent` (ver `docs/adr/0004-leads-analytics-integration-via-domain-event.md`), sin que Perfil sepa que Analytics existe.

## Example dialogue

> **Dev:** "Si el comprador nunca deja su teléfono pero después llega al concesionario, ¿cómo sabemos que es la misma persona?"
> **Domain expert:** "No lo sabemos — sin Contacto no hay forma de correlacionar. Un Perfil sin Contacto sirve para patrones generales de comportamiento, no para reconocer a esa persona específica en piso."

> **Dev:** "Alguien manda tres mensajes y se va sin decir nada concreto. ¿Qué Perfil le queda?"
> **Domain expert:** "Ninguno, y está bien. Sus tres turnos quedan en la Conversación y sus etapas del funnel en Analytics — la interacción no se pierde. El Perfil guarda lo que la persona declaró, y no declaró nada." 

## Flagged ambiguities

- Se discutió correlacionar Perfiles anónimos por IP del dispositivo — descartado: NAT/redes compartidas lo hacen poco confiable, y ya existe el patrón de `sessionId` anónimo en `localStorage` que Analytics usa para lo mismo (ver `analytics/CONTEXT.md`).
- No está confirmado si Perfil reutiliza literalmente el mismo valor de `sessionId` (`car-dealer-session-id` en `localStorage`) que ya usa Analytics, o si genera su propio identificador anónimo independiente — a confirmar con el equipo técnico.
- Se afirmaba que el Perfil "existe de forma anónima" sin justificar por qué — **resuelto (ADR-0012)**: era descriptivo, no prescriptivo. No había ADR ni razonamiento detrás, y la única discusión registrada sobre correlacionar Perfiles (por IP) se descartó por poco confiable, no por privacidad. El Contacto pasa a vivir en el Perfil.
- El Perfil se creaba en cada turno del Agente, hubiera o no algo que extraer, dejando filas de puros nulls — **resuelto (ADR-0012)**: creación perezosa, al primer dato declarado.
- El término **Wizard** describía a la vez un mecanismo de captura (opciones cerradas, determinista) y una UI (formulario paginado en su propia página). El pivote conversacional (CEB-69) mueve esas opciones adentro de la Conversación — **resuelto**: el mecanismo sobrevive sin cambios y se renombra a **Atajo**; lo que muere es la página, no la captura. `CaptureWizardCompletionCommand` desaparece porque los Atajos ahora llegan de a uno dentro de `SendMessageCommand`, no los dos juntos al final de un formulario; se reusan los comandos por hecho que ya existen y la normalización de presupuesto tal cual.
- El estándar de ventas tiene **dos listas que no coinciden**: las seis preguntas de la sección 06 no incluyen el presupuesto, y la Calificación del glosario sí lo exige pero no menciona el Punto de dolor ni el Innegociable. **Resuelto acá**: manda la Calificación como compuerta (es lo que el propio estándar define como "antes de hablar de precios") y las otras dos preguntas se capturan igual porque son munición para *cómo* vender, no requisitos para cotizar. Vale llevarle la inconsistencia al equipo que escribió el documento.
- El **detalle personal** que el estándar manda anotar (lo que el comprador suelta de su vida sin que se lo pidan, y de donde sale el regalo de la entrega) se evaluó como concepto propio del Perfil y **se aplazó**: la Conversación ya guarda cada turno textual, así que modelar un campo hoy sería extraer una cosa puntual de un corpus que ya está completo. Se analiza el corpus cuando se sepa qué se está buscando.
  Si algún día se modela, dos reglas del estándar no son opcionales: **se captura solo lo que el comprador ofrece, nunca se pregunta** (preguntar por el hobby incomoda y se nota), y **el Agente no lo menciona jamás** — el regalo funciona porque el cliente no sabe que alguien lo anotó; devolvérselo en el turno siguiente lo convierte de atención en vigilancia.
  La tercera regla del estándar —que la ficha lleve la línea siempre, aunque diga "no surgió"— **no traduce**: existe porque un humano puede no anotar, y es una casilla que denuncia esa omisión. El Agente no puede dejar de anotar, así que para nosotros la ausencia ya significa "no surgió".

