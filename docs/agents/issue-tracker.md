# Issue tracker: Linear

Issues y PRDs de este repo viven en Linear — Team **JFS**, Project **Car Dealer**. Usar el skill `linear-cli` (CLI `linear`) para todas las operaciones.

## Conventions

- **Crear un issue**: `linear issue create --team JFS --project "Car Dealer" --title "..." --description-file <archivo>`. Usar `--description-file` para bodies multi-línea (ver reglas de `linear-cli`).
- **Leer un issue**: `linear issue view <identifier> --comments`.
- **Listar issues**: `linear issue list --team JFS --sort manual` (agregar `--project`, `--label`, `--state` según haga falta — `linear issue list` requiere `--sort`).
- **Comentar**: `linear issue comment add <identifier> --body-file <archivo>`.
- **Aplicar/quitar labels**: subcomandos de `linear label` (ver `references/label.md` del skill `linear-cli`).
- **Estados**: flujo estándar de Linear (Backlog / Todo / In Progress / In Review / Done) — sin estados custom.

## When a skill says "publish to the issue tracker"

Crear un issue en Linear bajo Team JFS, Project "Car Dealer".

## When a skill says "fetch the relevant ticket"

`linear issue view <identifier> --comments`.

## Nota

El vocabulario de labels todavía no existe en el workspace de Linear — hay que crearlo manualmente. Ver `docs/agents/triage-labels.md` y el checklist de labels que genera `setup-product-harness`.
