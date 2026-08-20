import { MotivationCategory } from '../../domain/profile.aggregate';

export class CaptureMotivationCommand {
  constructor(
    public readonly sessionId: string,
    public readonly category: MotivationCategory,
    public readonly detail: string,
  ) {}
}
