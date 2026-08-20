import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Profile as ProfileRow } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CaptureBudgetCommand } from '../application/commands/capture-budget.command';
import { CaptureMotivationCommand } from '../application/commands/capture-motivation.command';
import { CaptureNeedCommand } from '../application/commands/capture-need.command';
import { CaptureObjectionCommand } from '../application/commands/capture-objection.command';
import { CaptureWizardCompletionCommand } from '../application/commands/capture-wizard-completion.command';
import { GetProfileByIdQuery } from '../application/queries/get-profile-by-id.query';
import { GetProfileBySessionQuery } from '../application/queries/get-profile-by-session.query';
import { CaptureBudgetDto } from './dto/capture-budget.dto';
import { CaptureMotivationDto } from './dto/capture-motivation.dto';
import { CaptureNeedDto } from './dto/capture-need.dto';
import { CaptureObjectionDto } from './dto/capture-objection.dto';
import { CaptureWizardCompletionDto } from './dto/capture-wizard-completion.dto';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('needs')
  @UseGuards(ThrottlerGuard)
  async captureNeed(@Body() dto: CaptureNeedDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<CaptureNeedCommand, number>(
      new CaptureNeedCommand(dto.sessionId, dto.category, dto.detail),
    );
    return { id };
  }

  @Post('motivations')
  @UseGuards(ThrottlerGuard)
  async captureMotivation(@Body() dto: CaptureMotivationDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<CaptureMotivationCommand, number>(
      new CaptureMotivationCommand(dto.sessionId, dto.category, dto.detail),
    );
    return { id };
  }

  @Post('objections')
  @UseGuards(ThrottlerGuard)
  async captureObjection(@Body() dto: CaptureObjectionDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<CaptureObjectionCommand, number>(
      new CaptureObjectionCommand(dto.sessionId, dto.category, dto.detail),
    );
    return { id };
  }

  @Post('budget')
  @UseGuards(ThrottlerGuard)
  async captureBudget(@Body() dto: CaptureBudgetDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<CaptureBudgetCommand, number>(
      new CaptureBudgetCommand(dto.sessionId, dto.min, dto.max),
    );
    return { id };
  }

  // Completar el Wizard sigue disparando QUIZ_COMPLETED hacia Analytics
  // sin cambios (ver apps/frontend/src/pages/public/Quiz.tsx) — esta es una
  // llamada adicional, no un reemplazo (ver CEB-41).
  @Post('wizard-completion')
  @UseGuards(ThrottlerGuard)
  async captureWizardCompletion(@Body() dto: CaptureWizardCompletionDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<CaptureWizardCompletionCommand, number>(
      new CaptureWizardCompletionCommand(dto.sessionId, dto.uso, dto.presupuesto),
    );
    return { id };
  }

  // ponytail: anónimo a propósito — sessionId funciona como la "credencial"
  // (mismo criterio que Analytics/Sesión), es el propio comprador consultando
  // lo que ya contó de sí mismo, no un dato ajeno.
  @Get('by-session/:sessionId')
  @UseGuards(ThrottlerGuard)
  async getBySession(@Param('sessionId') sessionId: string): Promise<ProfileRow | null> {
    return this.queryBus.execute(new GetProfileBySessionQuery(sessionId));
  }

  // Lookup por id: la ruta del vendedor de piso vía Lead.profileId — protegida
  // igual que el resto del panel admin.
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ProfileRow | null> {
    return this.queryBus.execute(new GetProfileByIdQuery(id));
  }
}
