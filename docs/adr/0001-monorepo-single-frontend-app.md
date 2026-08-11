# Monorepo con una sola app de frontend

Repo greenfield para el comparador de vehículos: backend NestJS y frontend en un monorepo con npm workspaces. Se evaluó separar el frontend en dos apps Vite (pública + admin) pero se optó por una sola app con rutas públicas y `/admin` protegidas por login, porque para el volumen y equipo del MVP dos apps significan dos builds/deploys a mantener sin un beneficio claro todavía (no hay necesidad de SEO/perf aislada del panel admin en esta etapa).

## Consequences

Revisar si el admin panel crece mucho o si el sitio público necesita optimización de carga que el bundle del admin panel contamine — en ese punto, separar en `apps/public` + `apps/admin` es la salida natural.
