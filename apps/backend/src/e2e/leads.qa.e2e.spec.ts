import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// QA smoke — cierra los huecos de cobertura HTTP/auth de CEB-21/CEB-22 que
// solo se habían verificado a mano con curl durante la implementación.
// El throttler (CEB-21 AC4) vive en su propio archivo (leads-throttle.qa.e2e.spec.ts)
// para no compartir cuota de rate-limit con estos tests.
describe('Leads — QA smoke (HTTP + auth, criterios de aceptación por ticket)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  const createdIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    token = app.get(JwtService).sign({ sub: 1, email: 'admin@test.local' });
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.lead.deleteMany({ where: { id: { in: createdIds } } });
    }
    await app.close();
  });

  function baseLead(overrides: Record<string, unknown> = {}) {
    return {
      firstName: 'QA',
      lastName: 'Tester',
      phone: '+58 412 0000001',
      vehicleIds: [1, 2],
      ...overrides,
    };
  }

  // CEB-21
  it('POST /leads con datos válidos persiste con status NUEVO y devuelve 201 + id', async () => {
    const res = await request(app.getHttpServer())
      .post('/leads')
      .send(baseLead())
      .expect(201);
    expect(res.body.id).toEqual(expect.any(Number));
    createdIds.push(res.body.id);

    const row = await prisma.lead.findUnique({ where: { id: res.body.id } });
    expect(row?.status).toBe('NUEVO');
  });

  // CEB-22
  it('GET /leads devuelve los vehicleIds crudos, sin enriquecer', async () => {
    const created = await request(app.getHttpServer())
      .post('/leads')
      .send(baseLead({ vehicleIds: [10, 11] }))
      .expect(201);
    createdIds.push(created.body.id);

    const res = await request(app.getHttpServer())
      .get('/leads')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const lead = res.body.find((l: { id: number }) => l.id === created.body.id);
    expect(lead.vehicleIds).toEqual([10, 11]);
    expect(lead.firstName).toBeDefined();
  });

  it('GET /leads sin JWT devuelve 401', async () => {
    await request(app.getHttpServer()).get('/leads').expect(401);
  });

  it('PATCH /leads/:id/status sin JWT devuelve 401', async () => {
    await request(app.getHttpServer())
      .patch('/leads/999999/status')
      .send({ status: 'CONTACTADO' })
      .expect(401);
  });

  it('PATCH /leads/:id/status sobre un id inexistente devuelve 404', async () => {
    await request(app.getHttpServer())
      .patch('/leads/999999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTADO' })
      .expect(404);
  });
});
