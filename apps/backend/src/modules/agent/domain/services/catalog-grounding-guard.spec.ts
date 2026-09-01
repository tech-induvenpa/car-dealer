import { CatalogSnapshotEntry, validateCatalogGrounding } from './catalog-grounding-guard';

const CATALOG: CatalogSnapshotEntry[] = [
  { vehicleId: 1, isPublished: true },
  { vehicleId: 2, isPublished: true },
  { vehicleId: 3, isPublished: false },
];

describe('validateCatalogGrounding', () => {
  it('is valid when every referenced vehicle exists and is published', () => {
    const result = validateCatalogGrounding([1, 2], CATALOG);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('is valid when no vehicles are referenced at all', () => {
    const result = validateCatalogGrounding([], CATALOG);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('is invalid when a referenced vehicle does not exist in the catalog, naming the id', () => {
    const result = validateCatalogGrounding([1, 999], CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual([{ vehicleId: 999, reason: 'NOT_FOUND' }]);
  });

  it('is invalid when a referenced vehicle exists but is not published', () => {
    const result = validateCatalogGrounding([3], CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual([{ vehicleId: 3, reason: 'NOT_PUBLISHED' }]);
  });

  it('collects every violation, not just the first one', () => {
    const result = validateCatalogGrounding([999, 3, 1], CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations).toEqual([
      { vehicleId: 999, reason: 'NOT_FOUND' },
      { vehicleId: 3, reason: 'NOT_PUBLISHED' },
    ]);
  });
});
