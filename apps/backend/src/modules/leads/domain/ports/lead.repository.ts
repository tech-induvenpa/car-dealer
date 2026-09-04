import { Lead } from '../lead.aggregate';

export const LEAD_REPOSITORY = Symbol('LeadRepository');

export interface LeadRepository {
  save(lead: Lead): Promise<number>;
  findById(id: number): Promise<Lead | null>;
  // CEB-85: el Contacto vive en el Perfil y el Lead se materializa cuando
  // aparece un Vehículo. Se intenta en cada turno, así que hace falta saber
  // si ya se materializó para no crear duplicados en conversaciones
  // posteriores de la misma sesión.
  existsByProfileId(profileId: number): Promise<boolean>;
}
