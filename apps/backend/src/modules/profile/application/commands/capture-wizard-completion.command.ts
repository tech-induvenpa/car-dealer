import { NeedCategory } from '../../domain/profile.aggregate';

export class CaptureWizardCompletionCommand {
  constructor(
    public readonly sessionId: string,
    public readonly uso: NeedCategory,
    public readonly presupuestoTope: number | '',
  ) {}
}
