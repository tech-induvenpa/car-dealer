import { ObjectionCategory } from '../profile.aggregate';

export class ObjectionCapturedEvent {
  constructor(
    public readonly profileId: number,
    public readonly category: ObjectionCategory,
    public readonly detail: string,
  ) {}
}
