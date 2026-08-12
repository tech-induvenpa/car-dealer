import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Archivo separado a propósito (mismo motivo que Leads): el ThrottlerStorage
// es en memoria por instancia de app, necesitamos una cuota de rate-limit
// limpia (30 req/60s) sin compartirla con los demás e2e de Analytics.
describe('Analytics — QA smoke (throttler, CEB-25 AC4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEventIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (createdEventIds.length > 0) {
      await prisma.analyticsEvent.deleteMany({ where: { id: { in: createdEventIds } } });
    }
    await app.close();
  });

  it('corta con 429 al superar 30 requests por IP en la ventana de 60s', async () => {
    const body = { type: 'VEHICLE_VIEWED', vehicleId: 888099 };
    const statuses: number[] = [];

    for (let i = 0; i < 31; i++) {
      const res = await request(app.getHttpServer()).post('/analytics/events').send(body);
      statuses.push(res.status);
      if (res.status === 201) createdEventIds.push(res.body.id);
    }

    expect(statuses.slice(0, 30).every((s) => s === 201)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});
