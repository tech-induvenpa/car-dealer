import { Profile } from '../../domain/profile.aggregate';
import { ProfileRepository } from '../../domain/ports/profile.repository';

// Lectura pura: devuelve el Perfil de la sesión o null. Existe porque desde
// ADR-0012 el Perfil se crea de forma perezosa — hay caminos (cada turno del
// Agente) que necesitan leerlo sin materializarlo.
export async function findProfile(
  repository: ProfileRepository,
  sessionId: string,
): Promise<Profile | null> {
  return repository.findBySessionId(sessionId);
}

// "Dame el Profile de esta sesión, creándolo vacío y persistido si es la
// primera vez". Solo se llama cuando YA hay un hecho declarado que guardar —
// llamarlo especulativamente es lo que llenaba la tabla de filas de nulls
// antes de ADR-0012.
export async function findOrCreateProfile(
  repository: ProfileRepository,
  sessionId: string,
): Promise<Profile> {
  const existing = await repository.findBySessionId(sessionId);
  if (existing) {
    return existing;
  }
  const id = await repository.save(Profile.create({ sessionId }));
  return Profile.reconstruct({
    id,
    sessionId,
    needs: [],
    motivations: [],
    objections: [],
    budgetRange: null,
    contact: null,
  });
}
