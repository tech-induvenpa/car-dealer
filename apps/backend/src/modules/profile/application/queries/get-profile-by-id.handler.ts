import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Profile as ProfileRow } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetProfileByIdQuery } from './get-profile-by-id.query';

// ponytail: es la misma consulta que usaría el vendedor de piso vía
// Lead.profileId — sin autorización especial todavía (no hay UI admin para
// esto en el MVP, ver CEB-36 Out of Scope de integración en vivo).
@QueryHandler(GetProfileByIdQuery)
export class GetProfileByIdHandler implements IQueryHandler<GetProfileByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProfileByIdQuery): Promise<ProfileRow | null> {
    return this.prisma.profile.findUnique({ where: { id: query.id } });
  }
}
