import { AggregateRoot } from '@nestjs/cqrs';
import { Price } from './value-objects/price.value-object';
import { InvalidVehicleYearException } from './exceptions/invalid-vehicle-year.exception';
import { normalizeFuelEconomy } from './normalize-fuel-economy';
import {
  Brand,
  DriveType,
  FuelEconomyUnit,
  FuelType,
  TransmissionType,
  VehicleCategory,
} from './vehicle-enums';

const MIN_YEAR = 1990;

// ponytail: campos primitivos, no VOs — sin invariantes cruzadas ni
// comportamiento propio (ver ADR-0005). Agrupados en una interfaz solo
// para no tener un constructor de 25 parámetros posicionales.
export interface VehicleSpecs {
  displacementCc: number | null;
  cylinders: number | null;
  horsepowerHp: number | null;
  torqueNm: number | null;
  fuelType: FuelType;
  transmissionType: TransmissionType;
  transmissionSpeeds: number | null;
  driveType: DriveType;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  wheelbaseMm: number | null;
  trunkCapacityL: number | null;
  weightKg: number | null;
  passengerCapacity: number | null;
  fuelEconomyValue: number | null;
  fuelEconomyUnit: FuelEconomyUnit | null;
  tankCapacityL: number | null;
  airbagsCount: number | null;
  hasAbs: boolean;
  hasStabilityControl: boolean;
  hasRearCamera: boolean;
  seatType: string | null;
  hasBluetooth: boolean;
  hasCarPlay: boolean;
  warrantyYears: number | null;
  warrantyKm: number | null;
  highlights: string[];
}

export interface CreateVehicleProps {
  brand: Brand;
  model: string;
  trim: string;
  year: number;
  price: number;
  priceIncludes: string | null;
  mainImageUrl: string;
  category: VehicleCategory;
  specs: VehicleSpecs;
}

export interface ReconstructVehicleProps extends CreateVehicleProps {
  id: number;
  fuelEconomyNormalizedKmPerL: number | null;
  isPublished: boolean;
}

export class Vehicle extends AggregateRoot {
  private constructor(
    private readonly _id: number | null,
    private readonly _brand: Brand,
    private readonly _model: string,
    private readonly _trim: string,
    private readonly _year: number,
    private readonly _price: Price,
    private readonly _mainImageUrl: string,
    private readonly _category: VehicleCategory,
    private readonly _specs: VehicleSpecs,
    private readonly _fuelEconomyNormalizedKmPerL: number | null,
    private readonly _isPublished: boolean,
  ) {
    super();
  }

  static create(props: CreateVehicleProps): Vehicle {
    Vehicle.assertValidYear(props.year);
    const price = Price.create(props.price, props.priceIncludes);
    const normalized = Vehicle.computeNormalizedFuelEconomy(props.specs);
    return new Vehicle(
      null,
      props.brand,
      props.model,
      props.trim,
      props.year,
      price,
      props.mainImageUrl,
      props.category,
      props.specs,
      normalized,
      true,
    );
  }

  static reconstruct(props: ReconstructVehicleProps): Vehicle {
    const price = Price.reconstruct(props.price, props.priceIncludes);
    return new Vehicle(
      props.id,
      props.brand,
      props.model,
      props.trim,
      props.year,
      price,
      props.mainImageUrl,
      props.category,
      props.specs,
      props.fuelEconomyNormalizedKmPerL,
      props.isPublished,
    );
  }

  private static assertValidYear(year: number): void {
    const maxYear = new Date().getFullYear() + 1;
    if (year < MIN_YEAR || year > maxYear) {
      throw new InvalidVehicleYearException(year, MIN_YEAR, maxYear);
    }
  }

  private static computeNormalizedFuelEconomy(specs: VehicleSpecs): number | null {
    if (specs.fuelEconomyValue == null || specs.fuelEconomyUnit == null) {
      return null;
    }
    return normalizeFuelEconomy(specs.fuelEconomyValue, specs.fuelEconomyUnit);
  }

  get id(): number | null {
    return this._id;
  }

  get brand(): Brand {
    return this._brand;
  }

  get model(): string {
    return this._model;
  }

  get trim(): string {
    return this._trim;
  }

  get year(): number {
    return this._year;
  }

  get price(): Price {
    return this._price;
  }

  get mainImageUrl(): string {
    return this._mainImageUrl;
  }

  get category(): VehicleCategory {
    return this._category;
  }

  get specs(): VehicleSpecs {
    return this._specs;
  }

  get fuelEconomyNormalizedKmPerL(): number | null {
    return this._fuelEconomyNormalizedKmPerL;
  }

  get isPublished(): boolean {
    return this._isPublished;
  }
}
