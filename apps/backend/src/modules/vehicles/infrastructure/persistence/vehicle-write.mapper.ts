import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { CreateVehicleProps } from '../../domain/vehicle.aggregate';

// ponytail: create, update e import comparten forma (reemplazo completo /
// alta individual) — un solo mapeo DTO->props para los tres.
export function toVehicleProps(dto: CreateVehicleDto): CreateVehicleProps {
  return {
    brand: dto.brand,
    model: dto.model,
    trim: dto.trim,
    year: dto.year,
    price: dto.price,
    priceIncludes: dto.priceIncludes ?? null,
    mainImageUrl: dto.mainImageUrl,
    category: dto.category,
    specs: {
      displacementCc: dto.specs.displacementCc ?? null,
      cylinders: dto.specs.cylinders ?? null,
      horsepowerHp: dto.specs.horsepowerHp ?? null,
      torqueNm: dto.specs.torqueNm ?? null,
      fuelType: dto.specs.fuelType,
      transmissionType: dto.specs.transmissionType,
      transmissionSpeeds: dto.specs.transmissionSpeeds ?? null,
      driveType: dto.specs.driveType,
      lengthMm: dto.specs.lengthMm ?? null,
      widthMm: dto.specs.widthMm ?? null,
      heightMm: dto.specs.heightMm ?? null,
      wheelbaseMm: dto.specs.wheelbaseMm ?? null,
      trunkCapacityL: dto.specs.trunkCapacityL ?? null,
      weightKg: dto.specs.weightKg ?? null,
      passengerCapacity: dto.specs.passengerCapacity ?? null,
      fuelEconomyValue: dto.specs.fuelEconomyValue ?? null,
      fuelEconomyUnit: dto.specs.fuelEconomyUnit ?? null,
      tankCapacityL: dto.specs.tankCapacityL ?? null,
      airbagsCount: dto.specs.airbagsCount ?? null,
      hasAbs: dto.specs.hasAbs,
      hasStabilityControl: dto.specs.hasStabilityControl,
      hasRearCamera: dto.specs.hasRearCamera,
      seatType: dto.specs.seatType ?? null,
      hasBluetooth: dto.specs.hasBluetooth,
      hasCarPlay: dto.specs.hasCarPlay,
      warrantyYears: dto.specs.warrantyYears ?? null,
      warrantyKm: dto.specs.warrantyKm ?? null,
      highlights: dto.specs.highlights,
    },
  };
}
