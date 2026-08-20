import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Profile } from '../../domain/profile.aggregate';
import { ProfileRepository } from '../../domain/ports/profile.repository';
import { ProfileMapper } from './profile.mapper';

@Injectable()
export class ProfileRepositoryAdapter implements ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(profile: Profile): Promise<number> {
    const data = ProfileMapper.toPersistence(profile);
    if (profile.id === null) {
      const created = await this.prisma.profile.create({ data });
      return created.id;
    }
    const updated = await this.prisma.profile.update({ where: { id: profile.id }, data });
    return updated.id;
  }

  async findById(id: number): Promise<Profile | null> {
    const row = await this.prisma.profile.findUnique({ where: { id } });
    return row ? ProfileMapper.toDomain(row) : null;
  }

  async findBySessionId(sessionId: string): Promise<Profile | null> {
    const row = await this.prisma.profile.findUnique({ where: { sessionId } });
    return row ? ProfileMapper.toDomain(row) : null;
  }
}
