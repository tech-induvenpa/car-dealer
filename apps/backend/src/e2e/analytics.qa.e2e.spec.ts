import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// QA smoke — cierra los huecos de cobertura HTTP/auth/dominio de CEB-25/
// CEB-26/CEB-27 que solo se habían verificado a mano con curl. El throttler
// (CEB-25 AC4) vive en su propio archivo (analytics-throttle.qa.e2e.spec.ts)
// para no compartir cuota de rate-limit con estos tests.
describe('Analytics — QA smoke (HTTP + auth + dominio, criterios por ticket)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  const createdEventIds: number[] = [];
  const createdLeadIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    token = app.get(JwtService).sign({ sub: 1, email: 'admin@test.local' });
  });

  afterAll(async () => {
    if (createdEventIds.length > 0) {
      await prisma.analyticsEvent.deleteMany({ where: { id: { in: createdEventIds } } });
    }
    if (createdLeadIds.length > 0) {
      await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
    }
    await app.close();
  });

  // CEB-27 AC5
  it('GET /analytics/dashboard sin JWT devuelve 401, con JWT devuelve 200', async () => {
    await request(app.getHttpServer()).get('/analytics/dashboard').expect(401);

    const res = await request(app.getHttpServer())
      .get('/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.topViewed).toBeDefined();
  });

  // CEB-25: el DTO excluye LEAD_SUBMITTED del endpoint público (evita
  // falsear "Leads por Vehículo") — verificado también live durante la
  // implementación, ahora como test de regresión.
  it('POST /analytics/events con type LEAD_SUBMITTED es rechazado', async () => {
    await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ type: 'LEAD_SUBMITTED', vehicleIds: [888001, 888002] })
      .expect(400);

    const row = await prisma.analyticsEvent.findFirst({
      where: { type: 'LEAD_SUBMITTED', vehicleIds: { equals: [888001, 888002] } },
    });
    expect(row).toBeNull();
  });

  // CEB-26 AC2
  it('el AnalyticsEvent derivado de un Lead nunca tiene sessionId', async () => {
    const leadRes = await request(app.getHttpServer())
      .post('/leads')
      .send({
        firstName: 'QA',
        lastName: 'Session',
        phone: '+58 412 8880003',
        vehicleIds: [888003],
      })
      .expect(201);
    createdLeadIds.push(leadRes.body.id);

    let row: { id: number; sessionId: string | null } | null = null;
    for (let attempt = 0; attempt < 20 && !row; attempt++) {
      row = await prisma.analyticsEvent.findFirst({
        where: { type: 'LEAD_SUBMITTED', metadata: { path: ['leadId'], equals: leadRes.body.id } },
      });
      if (!row) await new Promise((r) => setTimeout(r, 50));
    }

    expect(row).not.toBeNull();
    createdEventIds.push(row!.id);
    expect(row!.sessionId).toBeNull();
  });
});
