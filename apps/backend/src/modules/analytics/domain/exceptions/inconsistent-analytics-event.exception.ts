import { DomainException } from '../../../../shared/domain/domain.exception';
import { AnalyticsEventType } from '../analytics-event-type';

export class InconsistentAnalyticsEventException extends DomainException {
  constructor(type: AnalyticsEventType, missingField: string) {
    super(`El evento de tipo ${type} requiere el campo ${missingField}`);
  }
}
