import { NeedCategory } from '../profile.aggregate';

export class NeedCapturedEvent {
  constructor(
    public readonly profileId: number,
    public readonly category: NeedCategory,
    public readonly detail: string,
  ) {}
}
