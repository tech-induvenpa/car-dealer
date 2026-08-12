import { Body, Controller, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { ArchiveVehicleCommand } from '../application/commands/archive-vehicle.command';
import { CreateVehicleCommand } from '../application/commands/create-vehicle.command';
import { PublishVehicleCommand } from '../application/commands/publish-vehicle.command';
import { UpdateVehicleCommand } from '../application/commands/update-vehicle.command';
import { CreateVehicleProps } from '../domain/vehicle.aggregate';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

// ponytail: create y update comparten forma (reemplazo completo) — un solo
// mapeo DTO->props para los dos.
function toVehicleProps(dto: CreateVehicleDto): CreateVehicleProps {
  return {
    brand: dto.brand,
    model: dto.model,
    trim: dto.trim,
    year: dto.year,
    price: dto.price,
    priceIncludes: dto.priceIncludes ?? null,
    mainImageUrl: dto.mainImageUrl,
    category: dto.category,
    specs: {
      displacementCc: dto.specs.displacementCc ?? null,
      cylinders: dto.specs.cylinders ?? null,
      horsepowerHp: dto.specs.horsepowerHp ?? null,
      torqueNm: dto.specs.torqueNm ?? null,
      fuelType: dto.specs.fuelType,
      transmissionType: dto.specs.transmissionType,
      transmissionSpeeds: dto.specs.transmissionSpeeds ?? null,
      driveType: dto.specs.driveType,
      lengthMm: dto.specs.lengthMm ?? null,
      widthMm: dto.specs.widthMm ?? null,
      heightMm: dto.specs.heightMm ?? null,
      wheelbaseMm: dto.specs.wheelbaseMm ?? null,
      trunkCapacityL: dto.specs.trunkCapacityL ?? null,
      weightKg: dto.specs.weightKg ?? null,
      passengerCapacity: dto.specs.passengerCapacity ?? null,
      fuelEconomyValue: dto.specs.fuelEconomyValue ?? null,
      fuelEconomyUnit: dto.specs.fuelEconomyUnit ?? null,
      tankCapacityL: dto.specs.tankCapacityL ?? null,
      airbagsCount: dto.specs.airbagsCount ?? null,
      hasAbs: dto.specs.hasAbs,
      hasStabilityControl: dto.specs.hasStabilityControl,
      hasRearCamera: dto.specs.hasRearCamera,
      seatType: dto.specs.seatType ?? null,
      hasBluetooth: dto.specs.hasBluetooth,
      hasCarPlay: dto.specs.hasCarPlay,
      warrantyYears: dto.specs.warrantyYears ?? null,
      warrantyKm: dto.specs.warrantyKm ?? null,
      highlights: dto.specs.highlights,
    },
  };
}

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateVehicleDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<CreateVehicleCommand, number>(
      new CreateVehicleCommand(toVehicleProps(dto)),
    );
    return { id };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdateVehicleCommand, void>(
      new UpdateVehicleCommand(id, toVehicleProps(dto)),
    );
  }

  @Post(':id/archive')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async archive(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.commandBus.execute<ArchiveVehicleCommand, void>(new ArchiveVehicleCommand(id));
  }

  @Post(':id/publish')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async publish(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.commandBus.execute<PublishVehicleCommand, void>(new PublishVehicleCommand(id));
  }
}
