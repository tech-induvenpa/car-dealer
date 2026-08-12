import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';

// ponytail: sin @ArrayMinSize acá a propósito — "al menos 1 vehículo" es
// una regla de negocio real (ver CONTEXT.md), la tira el dominio
// (EmptyVehicleSelectionException), no una validación de forma del DTO.
export class CreateLeadDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsArray() @IsInt({ each: true }) vehicleIds: number[];
}
