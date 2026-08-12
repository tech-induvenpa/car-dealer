# Comparación de vehículos: cálculo del lado del backend, no del frontend

`CompareVehiclesByIdQuery` no se limita a devolver los vehículos solicitados: también calcula el Aviso de categoría dispar y el Ganador de comparación por cada campo con una dirección de "mejor" bien definida (ej. mayor caballaje, menor precio). Se decidió así porque son reglas de negocio del dominio Catalog, no lógica de presentación — dejarlo en el frontend habría duplicado la regla el día que exista otro cliente (app móvil), y mezclado conocimiento de dominio con la capa de UI. La regla vive en un Domain Service sin estado (`VehicleComparisonPolicy`) que consume una tabla estática `{ campo → HIGHER_BETTER | LOWER_BETTER | NOT_RANKED }`, no en Value Objects — la dirección no varía por instancia de vehículo, es una propiedad del campo en sí, y las Queries ya bypasean el aggregate por completo.

## Consequences

- Solo los campos en la whitelist tienen Ganador; el resto (peso, dimensiones, categóricos) se muestra como "difiere" sin marcar un ganador — evita inventar una dirección donde no la hay.
- El consumo (`fuelEconomyValue`) se normaliza a `fuelEconomyNormalizedKmPerL` al crear/editar el vehículo (no al comparar), para que la tabla de direcciones se mantenga estática sin excepciones por unidad. El valor tal como lo cargó el admin se conserva sin tocar, para fidelidad con la ficha del fabricante.
