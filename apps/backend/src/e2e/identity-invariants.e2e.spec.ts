import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Tracer-bullet e2e: composición real de Nest (AppModule sin overrides),
// Postgres real vía Prisma — cierra el PRD de Identity probando las 4
// End-to-End Invariants contra el sistema tal como corre en producción.
describe('Identity — invariantes end-to-end (INV-1 a INV-4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = 'inv-test-admin@test.local';
  const password = 'inv-test-password';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany({ where: { email } });
    await app.close();
  });

  it('INV-1: login con credenciales correctas emite un JWT que autentica un endpoint protegido real', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(meRes.body.email).toBe(email);
  });

  it('INV-2: credenciales incorrectas nunca emiten un token, siempre 401 con el mismo mensaje', async () => {
    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'not-the-password' })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody-inv-test@test.local', password })
      .expect(401);

    expect(wrongPassword.body.accessToken).toBeUndefined();
    expect(unknownEmail.body.accessToken).toBeUndefined();
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('INV-3: ninguna respuesta de /auth/login o /auth/me expone passwordHash', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    expect(loginRes.body.passwordHash).toBeUndefined();
    expect(JSON.stringify(loginRes.body)).not.toMatch(/passwordHash/i);

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
    expect(meRes.body.passwordHash).toBeUndefined();
    expect(JSON.stringify(meRes.body)).not.toMatch(/passwordHash/i);
  });

  it('INV-4: un request a un endpoint protegido sin JWT válido siempre es rechazado con 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-valid-signature.abc.def')
      .expect(401);
  });
});
