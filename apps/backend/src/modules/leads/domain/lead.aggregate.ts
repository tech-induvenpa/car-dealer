import { AggregateRoot } from '@nestjs/cqrs';
import { LeadSubmittedEvent } from './events/lead-submitted.event';
import { EmptyVehicleSelectionException } from './exceptions/empty-vehicle-selection.exception';
import { InvalidLeadStatusTransitionException } from './exceptions/invalid-lead-status-transition.exception';
import { LeadStatus } from './lead-status';

// ponytail: única regla de negocio de la transición — el resto del tiempo
// es simplemente "no permitida". CONVERTIDO/DESCARTADO sin salida (finales).
const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.NUEVO]: [LeadStatus.CONTACTADO, LeadStatus.CONVERTIDO, LeadStatus.DESCARTADO],
  [LeadStatus.CONTACTADO]: [LeadStatus.CONVERTIDO, LeadStatus.DESCARTADO],
  [LeadStatus.CONVERTIDO]: [],
  [LeadStatus.DESCARTADO]: [],
};

export interface CreateLeadProps {
  firstName: string;
  lastName: string;
  phone: string;
  vehicleIds: number[];
  profileId?: number | null;
}

export interface ReconstructLeadProps extends CreateLeadProps {
  id: number;
  status: LeadStatus;
}

export class Lead extends AggregateRoot {
  private constructor(
    private _id: number | null,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _phone: string,
    private readonly _vehicleIds: number[],
    private _status: LeadStatus,
    private readonly _profileId: number | null,
  ) {
    super();
  }

  static create(props: CreateLeadProps): Lead {
    if (props.vehicleIds.length === 0) {
      throw new EmptyVehicleSelectionException();
    }
    return new Lead(
      null,
      props.firstName,
      props.lastName,
      props.phone,
      props.vehicleIds,
      LeadStatus.NUEVO,
      props.profileId ?? null,
    );
  }

  static reconstruct(props: ReconstructLeadProps): Lead {
    return new Lead(
      props.id,
      props.firstName,
      props.lastName,
      props.phone,
      props.vehicleIds,
      props.status,
      props.profileId ?? null,
    );
  }

  // ponytail: el id lo asigna la BD recién al persistir — "Lead enviado"
  // solo tiene sentido de dominio una vez que existe un registro real, así
  // que el evento se aplica acá (llamado por el handler post-save), no en
  // create(). Ver Rule 3 de ddd-hexa: nunca despachar antes de persistir.
  recordSubmission(id: number): void {
    this._id = id;
    this.apply(new LeadSubmittedEvent(id, this._vehicleIds));
  }

  changeStatus(newStatus: LeadStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new InvalidLeadStatusTransitionException(this._status, newStatus);
    }
    this._status = newStatus;
  }

  get id(): number | null {
    return this._id;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get phone(): string {
    return this._phone;
  }

  get vehicleIds(): number[] {
    return this._vehicleIds;
  }

  get status(): LeadStatus {
    return this._status;
  }

  get profileId(): number | null {
    return this._profileId;
  }
}
