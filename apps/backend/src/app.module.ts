import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AnalyticsModule } from './modules/analytics/infrastructure/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/infrastructure/leads.module';
import { VehiclesModule } from './modules/vehicles/infrastructure/vehicles.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
    AuthModule,
    VehiclesModule,
    LeadsModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
