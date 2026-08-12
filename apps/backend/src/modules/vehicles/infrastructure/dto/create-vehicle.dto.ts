import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import {
  Brand,
  DriveType,
  FuelEconomyUnit,
  FuelType,
  TransmissionType,
  VehicleCategory,
} from '../../domain/vehicle-enums';

// ponytail: validación de forma (tipos/presencia), no de reglas de negocio
// — esas viven en el aggregate (Price, year range) y corren igual para el
// import masivo, que no pasa por este DTO.
class VehicleSpecsDto {
  @IsOptional() @IsInt() displacementCc?: number;
  @IsOptional() @IsInt() cylinders?: number;
  @IsOptional() @IsInt() horsepowerHp?: number;
  @IsOptional() @IsInt() torqueNm?: number;
  @IsEnum(FuelType) fuelType: FuelType;
  @IsEnum(TransmissionType) transmissionType: TransmissionType;
  @IsOptional() @IsInt() transmissionSpeeds?: number;
  @IsEnum(DriveType) driveType: DriveType;
  @IsOptional() @IsInt() lengthMm?: number;
  @IsOptional() @IsInt() widthMm?: number;
  @IsOptional() @IsInt() heightMm?: number;
  @IsOptional() @IsInt() wheelbaseMm?: number;
  @IsOptional() @IsInt() trunkCapacityL?: number;
  @IsOptional() @IsInt() weightKg?: number;
  @IsOptional() @IsInt() passengerCapacity?: number;
  @IsOptional() @IsNumber() fuelEconomyValue?: number;
  @IsOptional() @IsEnum(FuelEconomyUnit) fuelEconomyUnit?: FuelEconomyUnit;
  @IsOptional() @IsInt() tankCapacityL?: number;
  @IsOptional() @IsInt() airbagsCount?: number;
  @IsBoolean() hasAbs: boolean;
  @IsBoolean() hasStabilityControl: boolean;
  @IsBoolean() hasRearCamera: boolean;
  @IsOptional() @IsString() seatType?: string;
  @IsBoolean() hasBluetooth: boolean;
  @IsBoolean() hasCarPlay: boolean;
  @IsOptional() @IsInt() warrantyYears?: number;
  @IsOptional() @IsInt() warrantyKm?: number;
  @IsArray() @IsString({ each: true }) highlights: string[];
}

export class CreateVehicleDto {
  @IsEnum(Brand) brand: Brand;
  @IsString() model: string;
  @IsString() trim: string;
  @IsInt() year: number;
  @IsNumber() @IsPositive() price: number;
  @IsOptional() @IsString() priceIncludes?: string;
  @IsUrl() mainImageUrl: string;
  @IsEnum(VehicleCategory) category: VehicleCategory;

  @IsDefined()
  @ValidateNested()
  @Type(() => VehicleSpecsDto)
  specs: VehicleSpecsDto;
}
