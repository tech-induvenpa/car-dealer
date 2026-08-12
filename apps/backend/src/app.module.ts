import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { VehiclesModule } from './modules/vehicles/infrastructure/vehicles.module';

@Module({
  imports: [PrismaModule, AuthModule, VehiclesModule],
  controllers: [HealthController],
})
export class AppModule {}
