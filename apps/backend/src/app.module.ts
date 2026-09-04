import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AnalyticsModule } from './modules/analytics/infrastructure/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { AgentModule } from './modules/agent/infrastructure/agent.module';
import { LeadsModule } from './modules/leads/infrastructure/leads.module';
import { ProfileModule } from './modules/profile/infrastructure/profile.module';
import { VehiclesModule } from './modules/vehicles/infrastructure/vehicles.module';

@Module({
  imports: [
    PrismaModule,
    // Límite por defecto para los endpoints públicos de escritura puntual
    // (leads, eventos, capturas). Configurable por env para poder bajarlo en
    // tests sin tocar código. El chat NO usa este límite: ver el @Throttle
    // propio de POST /agent/messages.
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT ?? 5) },
    ]),
    AuthModule,
    VehiclesModule,
    LeadsModule,
    ProfileModule,
    AgentModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
