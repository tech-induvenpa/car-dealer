import { AggregateRoot } from '@nestjs/cqrs';
import { BudgetCapturedEvent } from './events/budget-captured.event';
import { MotivationCapturedEvent } from './events/motivation-captured.event';
import { NeedCapturedEvent } from './events/need-captured.event';
import { ObjectionCapturedEvent } from './events/objection-captured.event';
import { ProfileNotPersistedException } from './exceptions/profile-not-persisted.exception';
import { BudgetRange } from './value-objects/budget-range.value-object';

// ponytail: categorías provisionales — el Wizard ya usa SUV/COMPACTO/PICKUP
// para "uso" (ver CEB-41), así que Necesidad las reutiliza tal cual. Las de
// Motivación/Objeción no fueron confirmadas por el equipo comercial en la
// sesión de diseño — son un punto de partida razonable, ajustar cuando haya
// input real sin que eso rompa la forma del dominio (categoría + detalle).
export type NeedCategory = 'SUV' | 'COMPACTO' | 'PICKUP';
export type MotivationCategory = 'PRIMERA_COMPRA' | 'REEMPLAZO' | 'OTRO';
export type ObjectionCategory = 'PRECIO' | 'FINANCIAMIENTO' | 'MARCA' | 'OTRO';

export interface Need {
  category: NeedCategory;
  detail: string;
}

export interface Motivation {
  category: MotivationCategory;
  detail: string;
}

export interface Objection {
  category: ObjectionCategory;
  detail: string;
}

export interface CreateProfileProps {
  sessionId: string;
}

export interface ReconstructProfileProps {
  id: number;
  sessionId: string;
  needs: Need[];
  motivations: Motivation[];
  objections: Objection[];
  budgetRange: BudgetRange | null;
}

export class Profile extends AggregateRoot {
  private constructor(
    private _id: number | null,
    private readonly _sessionId: string,
    private _needs: Need[],
    private _motivations: Motivation[],
    private _objections: Objection[],
    private _budgetRange: BudgetRange | null,
  ) {
    super();
  }

  static create(props: CreateProfileProps): Profile {
    return new Profile(null, props.sessionId, [], [], [], null);
  }

  static reconstruct(props: ReconstructProfileProps): Profile {
    return new Profile(
      props.id,
      props.sessionId,
      props.needs,
      props.motivations,
      props.objections,
      props.budgetRange,
    );
  }

  private requirePersisted(): number {
    if (this._id === null) {
      throw new ProfileNotPersistedException();
    }
    return this._id;
  }

  captureNeed(category: NeedCategory, detail: string): void {
    const profileId = this.requirePersisted();
    this._needs = [...this._needs, { category, detail }];
    this.apply(new NeedCapturedEvent(profileId, category, detail));
  }

  captureMotivation(category: MotivationCategory, detail: string): void {
    const profileId = this.requirePersisted();
    this._motivations = [...this._motivations, { category, detail }];
    this.apply(new MotivationCapturedEvent(profileId, category, detail));
  }

  captureObjection(category: ObjectionCategory, detail: string): void {
    const profileId = this.requirePersisted();
    this._objections = [...this._objections, { category, detail }];
    this.apply(new ObjectionCapturedEvent(profileId, category, detail));
  }

  captureBudget(min: number, max: number): void {
    const profileId = this.requirePersisted();
    this._budgetRange = BudgetRange.create(min, max);
    this.apply(new BudgetCapturedEvent(profileId, min, max));
  }

  get id(): number | null {
    return this._id;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get needs(): Need[] {
    return this._needs;
  }

  get motivations(): Motivation[] {
    return this._motivations;
  }

  get objections(): Objection[] {
    return this._objections;
  }

  get budgetRange(): BudgetRange | null {
    return this._budgetRange;
  }

  get hasAnyData(): boolean {
    return (
      this._needs.length > 0 ||
      this._motivations.length > 0 ||
      this._objections.length > 0 ||
      this._budgetRange !== null
    );
  }
}
