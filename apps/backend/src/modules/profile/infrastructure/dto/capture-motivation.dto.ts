import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { MotivationCategory } from '../../domain/profile.aggregate';

const MOTIVATION_CATEGORIES: MotivationCategory[] = ['PRIMERA_COMPRA', 'REEMPLAZO', 'OTRO'];

export class CaptureMotivationDto {
  @IsString() @IsNotEmpty() sessionId: string;
  @IsIn(MOTIVATION_CATEGORIES) category: MotivationCategory;
  @IsString() @IsNotEmpty() detail: string;
}
