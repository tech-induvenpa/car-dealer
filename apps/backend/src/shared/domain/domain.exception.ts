// Base común para excepciones de reglas de negocio (cualquier módulo) — permite
// un único exception filter global en vez de listar cada excepción una por una.
export abstract class DomainException extends Error {}
