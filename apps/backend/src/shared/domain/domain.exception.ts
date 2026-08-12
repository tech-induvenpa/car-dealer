// Base común para excepciones de reglas de negocio (cualquier módulo) — permite
// un único exception filter global en vez de listar cada excepción una por una.
// httpStatus por defecto 400 (regla de negocio violada); subclases como
// "no encontrado" lo sobrescriben a 404.
export abstract class DomainException extends Error {
  readonly httpStatus: number = 400;
}
