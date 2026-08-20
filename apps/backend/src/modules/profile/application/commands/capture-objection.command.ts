import { ObjectionCategory } from '../../domain/profile.aggregate';

export class CaptureObjectionCommand {
  constructor(
    public readonly sessionId: string,
    public readonly category: ObjectionCategory,
    public readonly detail: string,
  ) {}
}
