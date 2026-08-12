import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../../auth/auth.module';
import { ArchiveVehicleHandler } from '../application/commands/archive-vehicle.handler';
import { CreateVehicleHandler } from '../application/commands/create-vehicle.handler';
import { PublishVehicleHandler } from '../application/commands/publish-vehicle.handler';
import { UpdateVehicleHandler } from '../application/commands/update-vehicle.handler';
import { CompareVehiclesByIdHandler } from '../application/queries/compare-vehicles-by-id.handler';
import { GetVehicleByIdHandler } from '../application/queries/get-vehicle-by-id.handler';
import { ListVehiclesHandler } from '../application/queries/list-vehicles.handler';
import { VEHICLE_REPOSITORY } from '../domain/ports/vehicle.repository';
import { VehicleRepositoryAdapter } from './persistence/vehicle.repository.adapter';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [VehiclesController],
  providers: [
    CreateVehicleHandler,
    UpdateVehicleHandler,
    ArchiveVehicleHandler,
    PublishVehicleHandler,
    ListVehiclesHandler,
    GetVehicleByIdHandler,
    CompareVehiclesByIdHandler,
    { provide: VEHICLE_REPOSITORY, useClass: VehicleRepositoryAdapter },
  ],
})
export class VehiclesModule {}
