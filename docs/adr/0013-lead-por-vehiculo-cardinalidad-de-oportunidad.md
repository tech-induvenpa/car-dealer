# Un Lead por Vehículo: adoptamos la cardinalidad de Oportunidad del estándar de ventas

Un **Lead** pasa a referenciar **exactamente un Vehículo**. Antes llevaba de 2 a 4 — "una foto de lo que el comprador tenía en pantalla al enviar". Una conversación que termina interesando al comprador en dos carros produce ahora **dos Leads**, cada uno con su propio Estado y su propio seguimiento.

Es la cardinalidad de **Oportunidad** del estándar de ventas de JFS ("A nadie se le deja esperando", agosto 2026): *"un cliente concreto queriendo un vehículo concreto. No es la persona: la misma persona puede tener dos oportunidades abiertas, una por cada carro que le interesa."* Se conserva el nombre **Lead** porque es el que ya vive en el código y en el panel de comercial; lo que se adopta es la forma.

Dos razones, y la primera es del negocio. Un Lead con un RAV4 y un Sportage **pertenece a dos concesionarios distintos** — el holding tiene cuatro concesionarios y tres marcas. Empaquetados, ninguno de los dos lo ve limpio: cada concesionario necesita saber que hubo un interesado en *uno de sus* vehículos. La segunda es de medición: el estándar cuenta Oportunidades, y con Leads multi-vehículo las cifras de las dos partes **no se pueden sumar**. Un Lead con tres carros son tres o uno según quién mire, que es exactamente el malentendido que la sección 09 del estándar denuncia.

El pivote conversacional ya empujaba en esa dirección sin que nadie lo planeara: el **Veredicto** nombra un solo vehículo recomendado, así que la conversación ya no termina en "cuatro que estaba mirando" sino en "este te conviene, y este era el otro".

## Alternativas consideradas

- **Traducir Leads multi-vehículo a Oportunidades en la frontera con el CRM.** Descartada: es una regla más que se puede desincronizar, y el problema que el estándar denuncia es justamente traducir entre dos idiomas.
- **Un solo Lead con el Vehículo recomendado, y la comparación como contexto.** Descartada: deja fuera al segundo concesionario, que también tuvo un interesado en su carro. Un carro que perdió sigue siendo información suya.

## Consequences

- El comprador decide cuántos Leads se crean, no el sistema: al pedir contacto el Agente pregunta explícitamente si cotizar los dos o solo uno. Aplica la máxima del estándar de no inferir lo que se puede preguntar, y evita duplicar el trabajo de comercial con Leads que nadie pidió.
- Aparece **Origen del Lead** (recomendado por el Veredicto · el otro lado de la comparación · pedido explícitamente). Es el registro de un hecho, no una escala de calor: se evaluó llamarlo "temperatura" y se descartó porque una escala invita a gradaciones que nadie puede defender. Qué origen cierra mejor se mide con los datos cuando los haya.
- Queda sin resolver **contra qué se comparó**: en el camino conversacional se recupera de la Conversación, pero un Lead del formulario de la vista de par no tiene Conversación detrás. Revisar si a comercial le sirve o si con el Origen alcanza.
- INV-9 ("un Contacto ofrecido nunca se pierde... se materializa un Lead") sigue valiendo, pero ahora puede materializar más de uno. El invariante habla de que el contacto no se pierda, no de cuántos Leads produce.
- El esquema cambia de `vehicleIds Int[]` a un `vehicleId` único. Los Leads existentes con varios vehículos necesitan migración: se expanden a uno por vehículo, con el Origen sin determinar.
