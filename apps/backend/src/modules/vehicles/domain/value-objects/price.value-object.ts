import { InvalidPriceException } from '../exceptions/invalid-price.exception';

export class Price {
  private constructor(
    private readonly _amount: number,
    private readonly _includes: string | null,
  ) {}

  static create(amount: number, includes?: string | null): Price {
    // ponytail: 0 = precio por confirmar (catálogo cargado antes de tener la
    // lista de precios). Ojo: un Vehículo en 0 publicado gana TODA comparación
    // por precio — archivarlo hasta cargarle el precio real.
    if (amount < 0) {
      throw new InvalidPriceException(amount);
    }
    return new Price(amount, includes ?? null);
  }

  static reconstruct(amount: number, includes: string | null): Price {
    return new Price(amount, includes);
  }

  get amount(): number {
    return this._amount;
  }

  get includes(): string | null {
    return this._includes;
  }
}
