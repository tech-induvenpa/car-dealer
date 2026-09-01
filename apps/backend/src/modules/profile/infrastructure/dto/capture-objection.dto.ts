import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ObjectionCategory } from '../../domain/profile.aggregate';

const OBJECTION_CATEGORIES: ObjectionCategory[] = ['PRECIO', 'FINANCIAMIENTO', 'MARCA', 'OTRO'];

export class CaptureObjectionDto {
  @IsString() @IsNotEmpty() sessionId: string;
  @IsIn(OBJECTION_CATEGORIES) category: ObjectionCategory;
  @IsString() @IsNotEmpty() detail: string;
}
