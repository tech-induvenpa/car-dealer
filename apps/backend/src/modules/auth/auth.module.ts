import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginHandler } from './application/queries/login.handler';
import { ADMIN_USER_REPOSITORY } from './domain/ports/admin-user.repository';
import { AuthController } from './infrastructure/auth.controller';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { AdminUserRepositoryAdapter } from './infrastructure/persistence/admin-user.repository.adapter';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    LoginHandler,
    { provide: ADMIN_USER_REPOSITORY, useClass: AdminUserRepositoryAdapter },
  ],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
