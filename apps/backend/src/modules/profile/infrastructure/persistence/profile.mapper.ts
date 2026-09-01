import { Prisma, Profile as ProfileRow } from '@prisma/client';
import { Motivation, Need, Objection, Profile } from '../../domain/profile.aggregate';
import { BudgetRange } from '../../domain/value-objects/budget-range.value-object';

export class ProfileMapper {
  static toDomain(row: ProfileRow): Profile {
    return Profile.reconstruct({
      id: row.id,
      sessionId: row.sessionId,
      needs: row.needs as unknown as Need[],
      motivations: row.motivations as unknown as Motivation[],
      objections: row.objections as unknown as Objection[],
      budgetRange:
        row.budgetMin !== null && row.budgetMax !== null
          ? BudgetRange.reconstruct(row.budgetMin, row.budgetMax)
          : null,
    });
  }

  static toPersistence(profile: Profile): Omit<Prisma.ProfileCreateInput, 'id'> {
    return {
      sessionId: profile.sessionId,
      needs: profile.needs as unknown as Prisma.InputJsonValue,
      motivations: profile.motivations as unknown as Prisma.InputJsonValue,
      objections: profile.objections as unknown as Prisma.InputJsonValue,
      budgetMin: profile.budgetRange?.min ?? null,
      budgetMax: profile.budgetRange?.max ?? null,
    };
  }
}
