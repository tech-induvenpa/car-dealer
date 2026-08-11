# Product Map

## Vision

Construir la plataforma de referencia del mercado para comparar vehículos por ficha técnica — un producto comercial y público por derecho propio, no una herramienta interna. El MVP resuelve el caso de uso del holding (Toyota, Kia, Changan en Venezuela) como primer cliente, pero la ambición es licenciar/comercializar la plataforma a concesionarios y marcas externas más adelante, con acceso vía credenciales/API como modelo de negocio.

## Key Personas

- **Comprador** — comparar fichas técnicas de vehículos fácil y rápido para decidir qué visitar/cotizar / pain point: hoy solo existen PDFs sueltos por marca, sin forma de comparar lado a lado.
- **Administrador de catálogo** — mantener el catálogo de vehículos siempre actualizado y disponible / pain point: la data vive en PDFs por marca, sin proceso centralizado; pasar de PDF a datos estructurados es manual.
- **Gerencia / equipo comercial** — entender qué se compara y qué se busca para tomar decisiones de negocio (stock, promoción, seguimiento de leads) / pain point: hoy no hay ninguna señal de comportamiento del comprador antes de que llegue al concesionario.

## Strategic Metrics / OKRs

- Leads generados / mes — mide la generación de demanda del comparador
- Comparaciones realizadas — mide adopción/uso real de la herramienta, más allá de si convierte a lead

## Bounded Contexts (Business View)

- **Catalog (Vehicles)** — mantiene el catálogo de vehículos con su ficha técnica completa, disponible para comparar.
- **Leads** — captura los datos de contacto de un comprador interesado junto con los vehículos que estaba comparando, para que comercial haga seguimiento.
- **Analytics** — registra qué se ve, qué se compara y qué se busca, y se lo devuelve al negocio como métricas accionables.
- **Identity** — controla quién puede entrar al panel y editar el catálogo.

## Current Initiatives

- **MVP Comparador** — comparador público + admin panel + captura de leads + analytics + quiz de descubrimiento ligero · status: planned

## Cross-BC Notes

<!-- Added by to-prd --enrich when a feature spans multiple bounded contexts -->
