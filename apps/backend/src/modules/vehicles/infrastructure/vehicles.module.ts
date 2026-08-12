import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../../auth/auth.module';
import { CreateVehicleHandler } from '../application/commands/create-vehicle.handler';
import { UpdateVehicleHandler } from '../application/commands/update-vehicle.handler';
import { VEHICLE_REPOSITORY } from '../domain/ports/vehicle.repository';
import { VehicleRepositoryAdapter } from './persistence/vehicle.repository.adapter';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [VehiclesController],
  providers: [
    CreateVehicleHandler,
    UpdateVehicleHandler,
    { provide: VEHICLE_REPOSITORY, useClass: VehicleRepositoryAdapter },
  ],
})
export class VehiclesModule {}
