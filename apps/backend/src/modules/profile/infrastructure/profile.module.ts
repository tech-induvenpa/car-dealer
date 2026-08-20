import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../../auth/auth.module';
import { CaptureBudgetHandler } from '../application/commands/capture-budget.handler';
import { CaptureMotivationHandler } from '../application/commands/capture-motivation.handler';
import { CaptureNeedHandler } from '../application/commands/capture-need.handler';
import { CaptureObjectionHandler } from '../application/commands/capture-objection.handler';
import { CaptureWizardCompletionHandler } from '../application/commands/capture-wizard-completion.handler';
import { GetProfileByIdHandler } from '../application/queries/get-profile-by-id.handler';
import { GetProfileBySessionHandler } from '../application/queries/get-profile-by-session.handler';
import { PROFILE_REPOSITORY } from '../domain/ports/profile.repository';
import { ProfileController } from './profile.controller';
import { ProfileRepositoryAdapter } from './persistence/profile.repository.adapter';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [ProfileController],
  providers: [
    CaptureNeedHandler,
    CaptureMotivationHandler,
    CaptureObjectionHandler,
    CaptureBudgetHandler,
    CaptureWizardCompletionHandler,
    GetProfileBySessionHandler,
    GetProfileByIdHandler,
    { provide: PROFILE_REPOSITORY, useClass: ProfileRepositoryAdapter },
  ],
  // exporta el puerto para que Agent (CEB-44) capture datos directamente
  // en el Profile de la Conversación en curso — mismo patrón que
  // VehiclesModule exporta VEHICLE_REPOSITORY para CEB-42.
  exports: [PROFILE_REPOSITORY],
})
export class ProfileModule {}
