import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { AnalyticsEventType } from '../../domain/analytics-event-type';

// ponytail: LEAD_SUBMITTED queda afuera a propósito — ese tipo solo lo crea
// el listener reactivo (ver ADR-0004), nunca el endpoint público. Si se
// aceptara acá, cualquiera podría falsear "Leads por Vehículo" en el
// dashboard con un POST directo.
const PUBLIC_EVENT_TYPES = [
  AnalyticsEventType.VEHICLE_VIEWED,
  AnalyticsEventType.VEHICLE_ADDED_TO_COMPARISON,
  AnalyticsEventType.COMPARISON_PERFORMED,
  AnalyticsEventType.QUIZ_COMPLETED,
];

export class RecordAnalyticsEventDto {
  @IsIn(PUBLIC_EVENT_TYPES) type: AnalyticsEventType;
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() @IsInt() vehicleId?: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) vehicleIds?: number[];
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
