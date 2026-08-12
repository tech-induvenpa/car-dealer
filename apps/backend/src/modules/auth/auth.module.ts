import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/jwt.strategy';

// ponytail: solo verificación de JWT (necesaria para proteger escrituras de Vehicles).
// El login/AdminUser real es su propio módulo, todavía no construido — ver CONTEXT.md de auth.
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
