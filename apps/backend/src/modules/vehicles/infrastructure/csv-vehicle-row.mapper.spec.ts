import { parseCsvVehicleRows } from './csv-vehicle-row.mapper';

describe('parseCsvVehicleRows', () => {
  it('splits flat CSV columns into top-level fields and nested specs', () => {
    const csv =
      'brand,model,trim,year,price,mainImageUrl,category,fuelType,transmissionType,driveType,horsepowerHp,hasAbs,hasStabilityControl,hasRearCamera,hasBluetooth,hasCarPlay,highlights\n' +
      'CHANGAN,CS35 Plus,Premium AWD,2024,24000,https://x.com/a.jpg,SUV,GASOLINA,CVT,AWD_4X4,150,true,true,true,true,false,Sunroof|LED';

    const [row] = parseCsvVehicleRows(csv);

    expect(row.brand).toBe('CHANGAN');
    expect(row.year).toBe(2024);
    expect(row.price).toBe(24000);
    expect((row.specs as any).horsepowerHp).toBe(150);
    expect((row.specs as any).hasAbs).toBe(true);
    expect((row.specs as any).hasCarPlay).toBe(false);
    expect((row.specs as any).highlights).toEqual(['Sunroof', 'LED']);
  });

  it('maps empty CSV cells to undefined instead of empty string', () => {
    const csv =
      'brand,model,trim,year,price,mainImageUrl,category,fuelType,transmissionType,driveType,horsepowerHp,hasAbs,hasStabilityControl,hasRearCamera,hasBluetooth,hasCarPlay,highlights\n' +
      'CHANGAN,CS35 Plus,Premium AWD,2024,24000,https://x.com/a.jpg,SUV,GASOLINA,CVT,AWD_4X4,,true,true,true,true,false,';

    const [row] = parseCsvVehicleRows(csv);

    expect((row.specs as any).horsepowerHp).toBeUndefined();
    expect((row.specs as any).highlights).toBeUndefined();
  });
});
