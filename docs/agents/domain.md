# Domain Docs

Cómo deben consumir los skills de ingeniería la documentación de dominio de este repo al explorar el código.

## Antes de explorar, leer esto

- **`PRODUCT-MAP.md`** en la raíz — visión de producto, personas, métricas estratégicas, e iniciativas actuales. Leer antes de proponer features o cambios de alcance.
- **`CONTEXT-MAP.md`** en la raíz — apunta a un `CONTEXT.md` por bounded context. Leer cada uno relevante al tema.
- **`docs/adr/`** en la raíz — decisiones a nivel sistema (ej. elección de stack, monorepo). También revisar `apps/backend/src/modules/<context>/docs/adr/` para decisiones específicas de cada contexto.
- **`apps/backend/src/modules/<context>/PRODUCT-CONTEXT.md`** — cuando existe (creado de forma perezosa por `to-prd --enrich`), documenta el problema de negocio, personas, reglas de negocio y fuera de alcance de ese bounded context específico.

Si alguno de estos archivos no existe todavía, **proceder en silencio**. No marcar su ausencia ni sugerir crearlos de antemano. El skill productor (`/grill-with-docs`) los crea de forma perezosa cuando los términos o decisiones realmente se resuelven.

## Estructura de archivos

Repo multi-context (presencia de `CONTEXT-MAP.md` en la raíz):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                                  ← decisiones a nivel sistema
└── apps/
    ├── backend/
    │   └── src/modules/
    │       ├── vehicles/
    │       │   ├── CONTEXT.md
    │       │   └── docs/adr/                  ← decisiones específicas del contexto
    │       ├── leads/
    │       │   ├── CONTEXT.md
    │       │   └── docs/adr/
    │       ├── analytics/
    │       │   ├── CONTEXT.md
    │       │   └── docs/adr/
    │       └── auth/
    │           ├── CONTEXT.md
    │           └── docs/adr/
    └── frontend/
```

## Usar el vocabulario del glosario

Cuando tu output nombra un concepto de dominio (en el título de un issue, una propuesta de refactor, una hipótesis, el nombre de un test), usar el término tal como está definido en el `CONTEXT.md` del bounded context correspondiente. No derivar hacia sinónimos que el glosario evita explícitamente.

Si el concepto que necesitás no está todavía en el glosario, es una señal — o estás inventando lenguaje que el proyecto no usa (reconsiderar) o hay un gap real (anotarlo para `/grill-with-docs`).

## Marcar conflictos con ADRs

Si tu output contradice un ADR existente, mostrarlo explícitamente en vez de sobreescribirlo en silencio:

> _Contradice ADR-0007 (nombre de la decisión) — pero vale la pena reabrirlo porque…_
