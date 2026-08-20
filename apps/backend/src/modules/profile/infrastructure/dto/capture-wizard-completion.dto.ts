import { IsIn, IsInt, IsNotEmpty, IsString, Min, ValidateIf } from 'class-validator';
import { NeedCategory } from '../../domain/profile.aggregate';

const NEED_CATEGORIES: NeedCategory[] = ['SUV', 'COMPACTO', 'PICKUP'];

export class CaptureWizardCompletionDto {
  @IsString() @IsNotEmpty() sessionId: string;
  @IsIn(NEED_CATEGORIES) uso: NeedCategory;

  // el Wizard manda '' para "más de $35,000" (ver Quiz.tsx) — sin algún
  // decorator acá, el ValidationPipe (whitelist: true) descarta el campo
  // en silencio antes de que llegue al handler.
  @ValidateIf((dto: CaptureWizardCompletionDto) => dto.presupuesto !== '')
  @IsInt()
  @Min(0)
  presupuesto: number | '';
}
