export const ADMIN_USER_REPOSITORY = Symbol('AdminUserRepository');

// ponytail: tipo de lectura plano, no una entidad — ver ADR-0007.
export interface AdminUserRecord {
  id: number;
  email: string;
  passwordHash: string;
}

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUserRecord | null>;
}
