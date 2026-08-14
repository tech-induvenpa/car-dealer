import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Archivo separado a propósito: el ThrottlerStorage es en memoria por
// instancia de app, y necesitamos una cuota de rate-limit limpia (5 req/60s)
// sin compartirla con los demás e2e de Leads que también hacen POST /leads.
describe('Leads — QA smoke (throttler, CEB-21 AC4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.lead.deleteMany({ where: { id: { in: createdIds } } });
    }
    await app.close();
  });

  it('corta con 429 al superar 5 requests por IP en la ventana de 60s', async () => {
    const lead = {
      firstName: 'Throttle',
      lastName: 'Test',
      phone: '+58 412 0000002',
      vehicleIds: [1],
    };
    const statuses: number[] = [];

    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer()).post('/leads').send(lead);
      statuses.push(res.status);
      if (res.status === 201) createdIds.push(res.body.id);
    }

    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
  });
});
