# Identity

Autentica a los usuarios internos que administran el catálogo. No tiene relación con los compradores públicos, que nunca se autentican.

## Language

**AdminUser**:
Cuenta de un solo rol para el personal interno del holding que puede entrar al admin panel — no es un concepto de cara al comprador.
_Avoid_: usuario (ambiguo con los visitantes públicos, que no son "usuarios" en el MVP), cliente.

**Sesión admin**:
El JWT emitido al hacer login, válido 30 días, sin refresh token — una ventana larga y fija en vez de renovación activa (ver ADR-0009). Volver a loguearse cada mes es aceptable para este MVP.
_Avoid_: token a secas (vale informalmente, pero "Sesión admin" es el concepto de dominio; el JWT es su representación técnica).

## Relationships

- **AdminUser** no tiene dependientes ni scoping en el MVP — sin roles, sin restricción por Marca o Concesionario (ver visión en `PRODUCT-MAP.md`, es un target de fase 2).

## Example dialogue

> **Dev:** "¿Un AdminUser de Toyota puede editar vehículos de Kia?"
> **Domain expert:** "Sí, por ahora todos los AdminUser tienen acceso total — no hay scoping por marca en el MVP."

## Flagged ambiguities

- Ninguna todavía.
