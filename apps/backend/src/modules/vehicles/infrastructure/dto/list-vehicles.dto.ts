import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Brand, VehicleCategory } from '../../domain/vehicle-enums';

export class ListVehiclesDto {
  @IsOptional() @IsEnum(Brand) brand?: Brand;
  @IsOptional() @IsEnum(VehicleCategory) category?: VehicleCategory;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
}
