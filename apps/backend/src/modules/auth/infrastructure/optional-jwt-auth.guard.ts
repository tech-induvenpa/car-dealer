import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// ponytail: rutas públicas que revelan más si vienen autenticadas (ej. catálogo
// admin) — nunca lanza 401, deja pasar como anónimo (req.user = null) si falta o
// es inválido el token.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
