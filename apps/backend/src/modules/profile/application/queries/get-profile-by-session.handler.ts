import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Profile as ProfileRow } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetProfileBySessionQuery } from './get-profile-by-session.query';

@QueryHandler(GetProfileBySessionQuery)
export class GetProfileBySessionHandler implements IQueryHandler<GetProfileBySessionQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProfileBySessionQuery): Promise<ProfileRow | null> {
    return this.prisma.profile.findUnique({ where: { sessionId: query.sessionId } });
  }
}
