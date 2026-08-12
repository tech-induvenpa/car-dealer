import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/infrastructure/optional-jwt-auth.guard';
import { ArchiveVehicleCommand } from '../application/commands/archive-vehicle.command';
import { CreateVehicleCommand } from '../application/commands/create-vehicle.command';
import { ImportVehiclesCommand } from '../application/commands/import-vehicles.command';
import { ImportVehiclesResult } from '../application/commands/import-vehicles.handler';
import { PublishVehicleCommand } from '../application/commands/publish-vehicle.command';
import { UpdateVehicleCommand } from '../application/commands/update-vehicle.command';
import { CompareVehiclesResult } from '../application/queries/compare-vehicles-by-id.handler';
import { CompareVehiclesByIdQuery } from '../application/queries/compare-vehicles-by-id.query';
import { GetVehicleByIdQuery } from '../application/queries/get-vehicle-by-id.query';
import { ListVehiclesQuery } from '../application/queries/list-vehicles.query';
import { VehicleNotFoundException } from '../domain/exceptions/vehicle-not-found.exception';
import { parseCsvVehicleRows } from './csv-vehicle-row.mapper';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleReadDto } from './persistence/vehicle-read.mapper';
import { toVehicleProps } from './persistence/vehicle-write.mapper';

@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(@Query() query: ListVehiclesDto, @Req() req: Request): Promise<VehicleReadDto[]> {
    const isAuthenticated = !!req.user;
    return this.queryBus.execute<ListVehiclesQuery, VehicleReadDto[]>(
      new ListVehiclesQuery({
        brand: query.brand,
        category: query.category,
        search: query.search,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        includeUnpublished: isAuthenticated,
      }),
    );
  }

  // Debe declararse antes de @Get(':id') — Nest resuelve rutas en orden de
  // declaración y ':id' capturaría "compare" como si fuera un id.
  @Get('compare')
  async compare(@Query('ids') idsParam?: string): Promise<CompareVehiclesResult> {
    const ids = (idsParam ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return this.queryBus.execute<CompareVehiclesByIdQuery, CompareVehiclesResult>(
      new CompareVehiclesByIdQuery(ids),
    );
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<VehicleReadDto> {
    const vehicle = await this.queryBus.execute<GetVehicleByIdQuery, VehicleReadDto | null>(
      new GetVehicleByIdQuery(id),
    );
    const isAuthenticated = !!req.user;
    if (!vehicle || (!vehicle.isPublished && !isAuthenticated)) {
      throw new VehicleNotFoundException(id);
    }
    return vehicle;
  }

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

  @Post('import')
  @UseGuards(JwtAuthGuard)
  async import(@Body() body: unknown): Promise<ImportVehiclesResult> {
    const rows =
      typeof body === 'string' ? parseCsvVehicleRows(body) : Array.isArray(body) ? body : [];
    return this.commandBus.execute<ImportVehiclesCommand, ImportVehiclesResult>(
      new ImportVehiclesCommand(rows),
    );
  }
}
