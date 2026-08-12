import { Prisma, Vehicle as VehicleRow } from '@prisma/client';
import { Vehicle } from '../../domain/vehicle.aggregate';
import {
  Brand,
  DriveType,
  FuelEconomyUnit,
  FuelType,
  TransmissionType,
  VehicleCategory,
} from '../../domain/vehicle-enums';

export class VehicleMapper {
  static toDomain(row: VehicleRow): Vehicle {
    return Vehicle.reconstruct({
      id: row.id,
      brand: row.brand as unknown as Brand,
      model: row.model,
      trim: row.trim,
      year: row.year,
      price: Number(row.price),
      priceIncludes: row.priceIncludes,
      mainImageUrl: row.mainImageUrl,
      category: row.category as unknown as VehicleCategory,
      specs: {
        displacementCc: row.displacementCc,
        cylinders: row.cylinders,
        horsepowerHp: row.horsepowerHp,
        torqueNm: row.torqueNm,
        fuelType: row.fuelType as unknown as FuelType,
        transmissionType: row.transmissionType as unknown as TransmissionType,
        transmissionSpeeds: row.transmissionSpeeds,
        driveType: row.driveType as unknown as DriveType,
        lengthMm: row.lengthMm,
        widthMm: row.widthMm,
        heightMm: row.heightMm,
        wheelbaseMm: row.wheelbaseMm,
        trunkCapacityL: row.trunkCapacityL,
        weightKg: row.weightKg,
        passengerCapacity: row.passengerCapacity,
        fuelEconomyValue: row.fuelEconomyValue ? Number(row.fuelEconomyValue) : null,
        fuelEconomyUnit: row.fuelEconomyUnit as unknown as FuelEconomyUnit | null,
        tankCapacityL: row.tankCapacityL,
        airbagsCount: row.airbagsCount,
        hasAbs: row.hasAbs,
        hasStabilityControl: row.hasStabilityControl,
        hasRearCamera: row.hasRearCamera,
        seatType: row.seatType,
        hasBluetooth: row.hasBluetooth,
        hasCarPlay: row.hasCarPlay,
        warrantyYears: row.warrantyYears,
        warrantyKm: row.warrantyKm,
        highlights: row.highlights,
      },
      fuelEconomyNormalizedKmPerL: row.fuelEconomyNormalizedKmPerL
        ? Number(row.fuelEconomyNormalizedKmPerL)
        : null,
      isPublished: row.isPublished,
    });
  }

  static toPersistence(vehicle: Vehicle): Omit<Prisma.VehicleCreateInput, 'id'> {
    const specs = vehicle.specs;
    return {
      brand: vehicle.brand as unknown as Prisma.VehicleCreateInput['brand'],
      model: vehicle.model,
      trim: vehicle.trim,
      year: vehicle.year,
      price: vehicle.price.amount,
      priceIncludes: vehicle.price.includes,
      mainImageUrl: vehicle.mainImageUrl,
      category: vehicle.category as unknown as Prisma.VehicleCreateInput['category'],
      displacementCc: specs.displacementCc,
      cylinders: specs.cylinders,
      horsepowerHp: specs.horsepowerHp,
      torqueNm: specs.torqueNm,
      fuelType: specs.fuelType as unknown as Prisma.VehicleCreateInput['fuelType'],
      transmissionType:
        specs.transmissionType as unknown as Prisma.VehicleCreateInput['transmissionType'],
      transmissionSpeeds: specs.transmissionSpeeds,
      driveType: specs.driveType as unknown as Prisma.VehicleCreateInput['driveType'],
      lengthMm: specs.lengthMm,
      widthMm: specs.widthMm,
      heightMm: specs.heightMm,
      wheelbaseMm: specs.wheelbaseMm,
      trunkCapacityL: specs.trunkCapacityL,
      weightKg: specs.weightKg,
      passengerCapacity: specs.passengerCapacity,
      fuelEconomyValue: specs.fuelEconomyValue,
      fuelEconomyUnit:
        specs.fuelEconomyUnit as unknown as Prisma.VehicleCreateInput['fuelEconomyUnit'],
      fuelEconomyNormalizedKmPerL: vehicle.fuelEconomyNormalizedKmPerL,
      tankCapacityL: specs.tankCapacityL,
      airbagsCount: specs.airbagsCount,
      hasAbs: specs.hasAbs,
      hasStabilityControl: specs.hasStabilityControl,
      hasRearCamera: specs.hasRearCamera,
      seatType: specs.seatType,
      hasBluetooth: specs.hasBluetooth,
      hasCarPlay: specs.hasCarPlay,
      warrantyYears: specs.warrantyYears,
      warrantyKm: specs.warrantyKm,
      highlights: specs.highlights,
      isPublished: vehicle.isPublished,
    };
  }
}
