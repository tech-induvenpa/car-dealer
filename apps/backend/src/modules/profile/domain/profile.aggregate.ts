import { AggregateRoot } from '@nestjs/cqrs';
import { BudgetCapturedEvent } from './events/budget-captured.event';
import { MotivationCapturedEvent } from './events/motivation-captured.event';
import { NeedCapturedEvent } from './events/need-captured.event';
import { ContactCapturedEvent } from './events/contact-captured.event';
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

// Contacto: nombre, apellido y teléfono, cuando el comprador los ofrece.
// Es un dato declarado más (ADR-0012) — tenerlo es lo que vuelve
// identificable a un Perfil.
export interface Contact {
  firstName: string;
  lastName: string;
  phone: string;
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
  contact: Contact | null;
}

export class Profile extends AggregateRoot {
  private constructor(
    private _id: number | null,
    private readonly _sessionId: string,
    private _needs: Need[],
    private _motivations: Motivation[],
    private _objections: Objection[],
    private _budgetRange: BudgetRange | null,
    private _contact: Contact | null,
  ) {
    super();
  }

  static create(props: CreateProfileProps): Profile {
    return new Profile(null, props.sessionId, [], [], [], null, null);
  }

  static reconstruct(props: ReconstructProfileProps): Profile {
    return new Profile(
      props.id,
      props.sessionId,
      props.needs,
      props.motivations,
      props.objections,
      props.budgetRange,
      props.contact,
    );
  }

  private requirePersisted(): number {
    if (this._id === null) {
      throw new ProfileNotPersistedException();
    }
    return this._id;
  }

  // La Necesidad REEMPLAZA, no se acumula — mismo comportamiento que
  // Presupuesto. Las categorías son tipos de carrocería mutuamente excluyentes
  // (SUV/COMPACTO/PICKUP): un comprador que dice "familiar" y después "para
  // ciudad" cambió de idea, no quiere las dos cosas. Acumularlas le mandaba al
  // Agente un profileSummary que se contradecía a sí mismo.
  //
  // Motivación y Objeción admiten varias A LA VEZ —que le preocupe el precio y
  // la marca es normal— pero una sola por categoría: decir dos veces algo sobre
  // el precio es actualizar esa objeción, no tener dos. Ver replaceByCategory.
  captureNeed(category: NeedCategory, detail: string): void {
    const profileId = this.requirePersisted();
    this._needs = [{ category, detail }];
    this.apply(new NeedCapturedEvent(profileId, category, detail));
  }

  captureMotivation(category: MotivationCategory, detail: string): void {
    const profileId = this.requirePersisted();
    this._motivations = replaceByCategory(this._motivations, { category, detail });
    this.apply(new MotivationCapturedEvent(profileId, category, detail));
  }

  captureObjection(category: ObjectionCategory, detail: string): void {
    const profileId = this.requirePersisted();
    this._objections = replaceByCategory(this._objections, { category, detail });
    this.apply(new ObjectionCapturedEvent(profileId, category, detail));
  }

  captureBudget(min: number, max: number): void {
    const profileId = this.requirePersisted();
    this._budgetRange = BudgetRange.create(min, max);
    this.apply(new BudgetCapturedEvent(profileId, min, max));
  }

  // Sin gate: el Contacto que el comprador OFRECE siempre se guarda. Lo que
  // sigue teniendo gate es que el Agente lo PIDA (assertCanRequestContact).
  // Antes una sola condición gobernaba las dos cosas y el contacto ofrecido
  // espontáneamente se descartaba en silencio — ver CEB-85.
  captureContact(firstName: string, lastName: string, phone: string): void {
    const profileId = this.requirePersisted();
    this._contact = { firstName, lastName, phone };
    this.apply(new ContactCapturedEvent(profileId, firstName, lastName, phone));
  }

  // "Nueva conversación" no debe arrastrar lo que el comprador dijo antes: si
  // pidió empezar de nuevo, el Agente empieza de nuevo. El Contacto NO se
  // borra —olvidar un teléfono porque alguien reinició sería perder un lead— y
  // los Eventos de Analytics ya emitidos son inmutables, así que no se pierde
  // nada analítico.
  forgetDeclaredFacts(): void {
    this.requirePersisted();
    this._needs = [];
    this._motivations = [];
    this._objections = [];
    this._budgetRange = null;
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

  get contact(): Contact | null {
    return this._contact;
  }

  get hasAnyData(): boolean {
    return (
      this._needs.length > 0 ||
      this._motivations.length > 0 ||
      this._objections.length > 0 ||
      this._budgetRange !== null ||
      this._contact !== null
    );
  }
}

// El Perfil guarda ESTADO ACTUAL, no historia: lo último por categoría gana, y
// la categoría nueva va al final para que el orden refleje qué se dijo más
// recientemente. La historia completa —cada cambio, con su momento— vive en los
// Eventos de Analytics (NEED_CAPTURED, OBJECTION_CAPTURED, ...), que son
// inmutables y llevan el profileId. Nada se pierde: son dos trabajos distintos
// en dos contextos distintos.
function replaceByCategory<T extends { category: string }>(current: T[], incoming: T): T[] {
  return [...current.filter((item) => item.category !== incoming.category), incoming];
}
