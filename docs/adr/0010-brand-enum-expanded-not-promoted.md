# Marca: se expande el enum fijo, no se promueve a entidad

CEB-29 evaluaba reemplazar `Brand` (enum fijo `TOYOTA | KIA | CHANGAN`) por una tabla dinámica administrable desde el admin panel, para no requerir un deploy cada vez que el holding suma una marca nueva. Se descartó: `Brand` no tiene ningún atributo más allá del nombre que justifique modelarla como entidad (mismo criterio que ADR-0005 — sin ceremonia sin invariante real), y no hay necesidad de negocio confirmada de un CRUD en caliente. En su lugar, el enum se expandió de 3 a 54 valores, cubriendo las marcas con presencia confirmada en el mercado automotor venezolano (las 19 afiliadas a CAVENEZ más marcas chinas/europeas/americanas adicionales con presencia activa) — investigado vía búsqueda web al momento de esta decisión. Hoy el holding solo comercializa Toyota, Kia y Changan; el resto se agrega preventivamente para cubrir el universo realista de opciones sin tocar código. Si en el futuro aparece una marca genuinamente nueva fuera de esa lista, es un valor de enum más una migración aditiva (`ALTER TYPE ... ADD VALUE`, sin backfill, sin riesgo de datos) — un evento esperado como esporádico y barato, no algo que amerite relación/módulo/CRUD nuevo.

El resto de los enums categóricos de Vehicle (`VehicleCategory`, `FuelType`, `TransmissionType`, `DriveType`, `FuelEconomyUnit`) tampoco se tocan — mismo razonamiento, y el propio ticket pedía explícitamente no asumir que todos necesitan el mismo tratamiento.

## Consequences

- Agregar una de las 54 marcas ya cubiertas a un Vehículo no requiere ningún cambio de código — ya está en el enum.
- Una marca genuinamente nueva (fuera de las 54) sigue requiriendo un cambio de código + migración + deploy — deliberado, es la vía barata para un evento raro, no la que se optimiza cuando ya "casi nunca" hace falta.
- Si algún día se necesita gestión de marcas en caliente (ej. franquicias nuevas frecuentes, o Marca gana atributos propios — logo, país de origen, etc.), esa es una decisión nueva con su propio análisis — este ADR no la descarta, solo la evita mientras no haya necesidad confirmada.
