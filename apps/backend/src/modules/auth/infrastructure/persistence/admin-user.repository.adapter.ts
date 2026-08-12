import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AdminUserRecord, AdminUserRepository } from '../../domain/ports/admin-user.repository';

@Injectable()
export class AdminUserRepositoryAdapter implements AdminUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    return this.prisma.adminUser.findUnique({ where: { email } });
  }
}
