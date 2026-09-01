import { NeedCategory } from '../../domain/profile.aggregate';

export class CaptureNeedCommand {
  constructor(
    public readonly sessionId: string,
    public readonly category: NeedCategory,
    public readonly detail: string,
  ) {}
}
