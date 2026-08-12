import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepository,
} from '../../domain/ports/admin-user.repository';
import { LoginQuery } from './login.query';

export interface LoginResult {
  accessToken: string;
}

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery> {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly repository: AdminUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(query: LoginQuery): Promise<LoginResult> {
    const admin = await this.repository.findByEmail(query.email);
    // ponytail: mismo camino de error (mismo await a bcrypt) exista o no el
    // email, para no filtrar por timing si el email está registrado.
    const passwordHash = admin?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const matches = await bcrypt.compare(query.password, passwordHash);

    if (!admin || !matches) {
      throw new InvalidCredentialsException();
    }

    const accessToken = this.jwtService.sign({ sub: admin.id, email: admin.email });
    return { accessToken };
  }
}
