import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { AdminUserRepository } from '../../domain/ports/admin-user.repository';
import { LoginHandler } from './login.handler';
import { LoginQuery } from './login.query';

describe('LoginHandler', () => {
  async function setup(admin: { id: number; email: string; passwordHash: string } | null) {
    const repository: jest.Mocked<AdminUserRepository> = {
      findByEmail: jest.fn().mockResolvedValue(admin),
    };
    const jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') } as unknown as JwtService;
    return { handler: new LoginHandler(repository, jwtService), repository, jwtService };
  }

  it('returns an access token for correct credentials', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    const { handler, jwtService } = await setup({ id: 1, email: 'admin@test.local', passwordHash });

    const result = await handler.execute(new LoginQuery('admin@test.local', 'correct-password'));

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, email: 'admin@test.local' });
  });

  it('rejects an incorrect password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    const { handler } = await setup({ id: 1, email: 'admin@test.local', passwordHash });

    await expect(
      handler.execute(new LoginQuery('admin@test.local', 'wrong-password')),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('rejects a non-existent email with the same exception', async () => {
    const { handler } = await setup(null);

    await expect(
      handler.execute(new LoginQuery('nobody@test.local', 'anything')),
    ).rejects.toThrow(InvalidCredentialsException);
  });
});
