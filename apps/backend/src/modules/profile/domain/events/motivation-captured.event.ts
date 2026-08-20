import { MotivationCategory } from '../profile.aggregate';

export class MotivationCapturedEvent {
  constructor(
    public readonly profileId: number,
    public readonly category: MotivationCategory,
    public readonly detail: string,
  ) {}
}
