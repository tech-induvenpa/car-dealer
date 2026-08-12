import { parse } from 'csv-parse/sync';

const NUMERIC_FIELDS = new Set([
  'year',
  'price',
  'displacementCc',
  'cylinders',
  'horsepowerHp',
  'torqueNm',
  'transmissionSpeeds',
  'lengthMm',
  'widthMm',
  'heightMm',
  'wheelbaseMm',
  'trunkCapacityL',
  'weightKg',
  'passengerCapacity',
  'fuelEconomyValue',
  'tankCapacityL',
  'airbagsCount',
  'warrantyYears',
  'warrantyKm',
]);

const BOOLEAN_FIELDS = new Set([
  'hasAbs',
  'hasStabilityControl',
  'hasRearCamera',
  'hasBluetooth',
  'hasCarPlay',
]);

const SPECS_FIELDS = new Set([
  'displacementCc',
  'cylinders',
  'horsepowerHp',
  'torqueNm',
  'fuelType',
  'transmissionType',
  'transmissionSpeeds',
  'driveType',
  'lengthMm',
  'widthMm',
  'heightMm',
  'wheelbaseMm',
  'trunkCapacityL',
  'weightKg',
  'passengerCapacity',
  'fuelEconomyValue',
  'fuelEconomyUnit',
  'tankCapacityL',
  'airbagsCount',
  'hasAbs',
  'hasStabilityControl',
  'hasRearCamera',
  'seatType',
  'hasBluetooth',
  'hasCarPlay',
  'warrantyYears',
  'warrantyKm',
  'highlights',
]);

function coerceValue(key: string, raw: string): unknown {
  if (raw === '') return undefined;
  if (key === 'highlights') {
    return raw
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (NUMERIC_FIELDS.has(key)) return Number(raw);
  if (BOOLEAN_FIELDS.has(key)) return raw.trim().toLowerCase() === 'true';
  return raw;
}

// ponytail: headers CSV son los mismos nombres de campo que el DTO/JSON,
// sin prefijo "specs." (los separa por whitelist, no por convención de
// nombres) — `highlights` usa "|" como separador porque "," ya es el
// delimitador de columnas.
function csvRowToVehicleInput(flatRow: Record<string, string>): Record<string, unknown> {
  const top: Record<string, unknown> = {};
  const specs: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(flatRow)) {
    const value = coerceValue(key, raw);
    if (SPECS_FIELDS.has(key)) {
      specs[key] = value;
    } else {
      top[key] = value;
    }
  }
  return { ...top, specs };
}

export function parseCsvVehicleRows(csvText: string): Record<string, unknown>[] {
  const flatRows: Record<string, string>[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return flatRows.map(csvRowToVehicleInput);
}
