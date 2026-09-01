import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { NeedCategory } from '../../domain/profile.aggregate';

const NEED_CATEGORIES: NeedCategory[] = ['SUV', 'COMPACTO', 'PICKUP'];

export class CaptureNeedDto {
  @IsString() @IsNotEmpty() sessionId: string;
  @IsIn(NEED_CATEGORIES) category: NeedCategory;
  @IsString() @IsNotEmpty() detail: string;
}
