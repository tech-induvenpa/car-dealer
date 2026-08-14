import { AnalyticsEventType } from './analytics-event-type';
import { InconsistentAnalyticsEventException } from './exceptions/inconsistent-analytics-event.exception';

export interface CreateAnalyticsEventProps {
  type: AnalyticsEventType;
  sessionId: string | null;
  vehicleId: number | null;
  vehicleIds: number[];
  metadata: Record<string, unknown> | null;
}

export interface ReconstructAnalyticsEventProps extends CreateAnalyticsEventProps {
  id: number;
  createdAt: Date;
}

// ponytail: sin AggregateRoot — nunca muta, no dispara eventos propios
// (ver ADR-0008). Sigue el estilo de un VO validado (create/reconstruct,
// inmutable), no el de un aggregate.
export class AnalyticsEvent {
  private constructor(
    private readonly _id: number | null,
    private readonly _type: AnalyticsEventType,
    private readonly _sessionId: string | null,
    private readonly _vehicleId: number | null,
    private readonly _vehicleIds: number[],
    private readonly _metadata: Record<string, unknown> | null,
    private readonly _createdAt: Date | null,
  ) {}

  static create(props: CreateAnalyticsEventProps): AnalyticsEvent {
    AnalyticsEvent.assertConsistent(props);
    return new AnalyticsEvent(
      null,
      props.type,
      props.sessionId,
      props.vehicleId,
      props.vehicleIds,
      props.metadata,
      null,
    );
  }

  static reconstruct(props: ReconstructAnalyticsEventProps): AnalyticsEvent {
    return new AnalyticsEvent(
      props.id,
      props.type,
      props.sessionId,
      props.vehicleId,
      props.vehicleIds,
      props.metadata,
      props.createdAt,
    );
  }

  private static assertConsistent(props: CreateAnalyticsEventProps): void {
    switch (props.type) {
      case AnalyticsEventType.VEHICLE_VIEWED:
      case AnalyticsEventType.VEHICLE_ADDED_TO_COMPARISON:
        if (props.vehicleId == null) {
          throw new InconsistentAnalyticsEventException(props.type, 'vehicleId');
        }
        break;
      case AnalyticsEventType.COMPARISON_PERFORMED:
        if (props.vehicleIds.length < 2 || props.vehicleIds.length > 4) {
          throw new InconsistentAnalyticsEventException(props.type, 'vehicleIds (2-4)');
        }
        break;
      case AnalyticsEventType.QUIZ_COMPLETED:
        if (props.metadata == null) {
          throw new InconsistentAnalyticsEventException(props.type, 'metadata');
        }
        break;
      case AnalyticsEventType.LEAD_SUBMITTED:
        if (props.vehicleIds.length === 0) {
          throw new InconsistentAnalyticsEventException(props.type, 'vehicleIds');
        }
        break;
    }
  }

  get id(): number | null {
    return this._id;
  }

  get type(): AnalyticsEventType {
    return this._type;
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  get vehicleId(): number | null {
    return this._vehicleId;
  }

  get vehicleIds(): number[] {
    return this._vehicleIds;
  }

  get metadata(): Record<string, unknown> | null {
    return this._metadata;
  }

  get createdAt(): Date | null {
    return this._createdAt;
  }
}
