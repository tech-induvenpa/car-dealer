# Catalog (Vehicles)

Dueño del catálogo de vehículos del holding: cada entrada es una ficha técnica completa y comparable. Es el contexto upstream — Leads y Analytics lo referencian, nunca al revés.

## Language

**Vehículo**:
Una entrada específica marca+modelo+versión+año con su ficha técnica completa — no una familia de modelos.
_Avoid_: Modelo (ambiguo, es solo un campo del Vehículo), Auto, Carro.

**Ficha técnica**:
El conjunto estructurado de specs (motor, dimensiones, consumo, seguridad, confort, garantía) que trae cada Vehículo.
_Avoid_: specs, detalles.

**Versión / Trim**:
La configuración específica de un modelo (ej. "Premium AWD") que junto a modelo+año identifica a un Vehículo.
_Avoid_: submodelo.

**Precio todo-incluido**:
El único campo de precio (USD) del Vehículo — ya incluye IVA, IGTF, matriculación, gastos operativos, etc. No hay desglose estructurado en el MVP.
_Avoid_: precio base, precio de lista (sugieren que existe un desglose, y no existe todavía).

**Destacados**:
Lista libre de features que no aplican parejo a todos los vehículos (ej. "Sunroof eléctrico") — separada de los campos estructurados de la ficha técnica.
_Avoid_: features, highlights.

**Categoría**:
El tipo de carrocería del vehículo (SUV, Sedán, Pickup, etc.) — se usa para avisar de comparaciones dispares, no para restringirlas.
_Avoid_: tipo, segmento.

**Archivar**:
Sacar un Vehículo del catálogo público (`isPublished = false`) sin borrar el registro — preserva la integridad de los Leads y Eventos de Analytics que lo referencian.
_Avoid_: borrar, eliminar (implican hard-delete, que este contexto nunca hace).

**Comparación**:
El resultado de evaluar entre 2 y 4 Vehículos lado a lado: incluye los datos completos de cada uno, el Aviso de categoría dispar (si aplica) y el Ganador de comparación por cada campo que lo tenga.
_Avoid_: comparativa.

**Comparable**:
Otro Vehículo contra el cual tiene sentido comparar este: misma **Categoría** y precio dentro de una banda alrededor del que se está mirando. Es el reverso exacto del **Aviso de categoría dispar** — un Comparable es, por definición, un Vehículo que no lo dispararía. La banda es **elástica, no una constante**: se define como el rango más angosto que junte al menos dos Comparables, y se muestra al comprador en vez de aplicarse en silencio. Así el criterio es explicable, nunca deja una lista vacía, y se va cerrando solo a medida que el catálogo crece.
Se calcula únicamente con datos de Catalog: **no** interviene el Perfil del comprador ni el modelo. Un Vehículo tiene los mismos Comparables para todo el mundo.
_Avoid_: similar, parecido (vagos — no dicen para qué sirve el parecido), alternativa (sugiere reemplazo, y acá el punto es contrastar), sugerencia (el Agente sugiere según lo que el comprador declaró; un Comparable es una propiedad del Vehículo, no del comprador).

**Aviso de categoría dispar**:
Mensaje no bloqueante que se muestra cuando los Vehículos de una Comparación pertenecen a Categorías consideradas muy distintas (ej. SUV vs Compacto) — informa, nunca impide comparar.
_Avoid_: warning, alerta.

**Ganador de comparación**:
Dentro de una Comparación, el Vehículo cuyo valor es mejor en un campo específico de la Ficha técnica (ej. mayor caballaje, menor precio). Solo aplica a campos con una dirección de "mejor" bien definida — campos ambiguos (peso, dimensiones) o categóricos no tienen Ganador.
_Avoid_: mejor valor.

## Relationships

- Un **Vehículo** tiene exactamente una **Ficha técnica** (embebida, no es un aggregate separado).
- Un **Vehículo** pertenece a una **Marca** (enum fijo con 54 valores conocidos del mercado venezolano — hoy el holding solo comercializa Toyota/Kia/Changan, ver ADR-0010) y una **Categoría**.
- **Leads** y **Eventos de Analytics** referencian a un **Vehículo** solo por ID — Catalog nunca depende de ellos.
- Una **Comparación** agrupa entre 2 y 4 **Vehículos** y puede producir un **Aviso de categoría dispar** y un **Ganador de comparación** por campo.
- Un **Vehículo** tiene un conjunto de **Comparables** derivado del catálogo publicado — misma Categoría y precio cercano. Es simétrico y estable: si B es Comparable de A, A lo es de B, y no depende de quién esté mirando.

## Example dialogue

> **Dev:** "¿El 'CS35 Plus' es un Vehículo, o es un Modelo con varios Vehículos adentro por cada versión?"
> **Domain expert:** "Cada versión es su propio Vehículo. 'CS35 Plus' a secas no se puede cargar — necesitás la entrada completa: Changan CS35 Plus 2024, con su propia ficha técnica y precio."

## Flagged ambiguities

- El **Precio** se discutió inicialmente como posible desglose (IVA, matriculación, etc. por separado) — resuelto: un solo campo todo-incluido + texto libre "incluye", sin desglose estructurado en el MVP.
- El consumo se guarda dos veces (tal como lo carga el admin + normalizado a KM_POR_L) — resuelto: preserva fidelidad con la ficha del fabricante para mostrar, y permite comparar sin reconvertir unidades en cada Comparación.
- El **Ancla / Retador** del comparador conversacional (CEB-69) se evaluó como posible asimetría dentro de **Comparación** — resuelto: **no** es un concepto de este contexto. Cuál de los dos Vehículos es el ancla depende de en qué URL está parado el comprador, no del dominio; `VehicleComparisonPolicy` devuelve los mismos Ganadores sin importar el orden en que se le pasen. La asimetría vive en la capa de aplicación. Por lo mismo **Comparación sigue admitiendo de 2 a 4 Vehículos** aunque la UI del pivote solo use 2: estrechar la policy obligaría a revertirla el día que se decida comparar de a tres.
- La banda de precio que define a un **Comparable** se discutió como constante (±25%) — resuelto: constante fija no sirve con el catálogo actual, que tiene pocos Vehículos publicados y dejaría secciones vacías o de un solo elemento. Queda **elástica** (el rango más angosto que junte al menos dos) y visible en pantalla. Falta afinar con datos reales cuál es el piso razonable de la banda antes de que "el más angosto que junte dos" empiece a devolver Vehículos que nadie compararía.
- El estándar de ventas de JFS pide **ficha comercial, no ficha técnica**: cada spec traducida a lo que le hace al comprador ("403 litros: caben dos maletas grandes y las compras"). Se evaluó modelarla como dato del Vehículo —que el admin la escriba— y **se descartó**: nadie va a auditar si en 403 litros caben dos maletas, así que exigir rigor ahí es aplicarle a una ilustración el estándar de un precio. La traducción la improvisa el Agente en cada turno, acotada por el prompt.
  La única línea que sí importa: la ilustración puede ser holgada, pero **no puede fabricar una spec**. "Caben dos maletas grandes" es traducción; "remolca 1.500 kg" o "entra un cochecito plegado" son capacidades nuevas que alguien puede tomar como compromiso, y esas tienen que salir de la Ficha técnica.
  Se revisa si el catálogo crece o si aparece una traducción que el negocio quiera fijar palabra por palabra.
- No confundir la traducción comercial con **Destacados**: Destacados son features que no aplican parejo a todos los vehículos (un sunroof); la traducción es la *misma* spec dicha en el idioma del comprador. Dos conceptos, dos nombres.

