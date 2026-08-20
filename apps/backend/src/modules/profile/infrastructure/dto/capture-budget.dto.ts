import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CaptureBudgetDto {
  @IsString() @IsNotEmpty() sessionId: string;
  @IsInt() @Min(0) min: number;
  @IsInt() @Min(0) max: number;
}
