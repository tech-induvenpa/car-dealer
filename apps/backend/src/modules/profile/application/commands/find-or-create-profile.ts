import { Profile } from '../../domain/profile.aggregate';
import { ProfileRepository } from '../../domain/ports/profile.repository';

// ponytail: única lógica compartida por los 4 comandos de captura — "dame el
// Profile de esta sesión, creándolo vacío y persistido si es la primera vez"
// — se extrae porque las 4 la necesitan igual, no por anticipación.
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
  });
}
