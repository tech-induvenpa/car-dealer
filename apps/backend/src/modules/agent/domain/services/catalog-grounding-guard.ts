export interface CatalogSnapshotEntry {
  vehicleId: number;
  isPublished: boolean;
}

export type GroundingViolationReason = 'NOT_FOUND' | 'NOT_PUBLISHED';

export interface GroundingViolation {
  vehicleId: number;
  reason: GroundingViolationReason;
}

export interface GroundingResult {
  valid: boolean;
  violations: GroundingViolation[];
}

// Deep module: valida INV-1 (el Agente nunca menciona un Vehículo fuera del
// catálogo real/publicado) de forma determinista — sin LLM, sin DB, solo un
// snapshot en memoria. La capa que llama al LLM real (CEB-42) es quien arma
// `referencedVehicleIds` a partir de la respuesta cruda antes de pasarla acá.
export function validateCatalogGrounding(
  referencedVehicleIds: number[],
  catalogSnapshot: CatalogSnapshotEntry[],
): GroundingResult {
  const byId = new Map(catalogSnapshot.map((entry) => [entry.vehicleId, entry]));

  const violations: GroundingViolation[] = [];
  for (const vehicleId of referencedVehicleIds) {
    const entry = byId.get(vehicleId);
    if (!entry) {
      violations.push({ vehicleId, reason: 'NOT_FOUND' });
    } else if (!entry.isPublished) {
      violations.push({ vehicleId, reason: 'NOT_PUBLISHED' });
    }
  }

  return { valid: violations.length === 0, violations };
}
