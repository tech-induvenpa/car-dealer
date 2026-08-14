import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Tracer-bullet e2e: composición real de Nest (AppModule sin overrides),
// Postgres real vía Prisma — cierra el PRD de Analytics probando las 4
// End-to-End Invariants contra el sistema tal como corre en producción.
describe('Analytics — invariantes end-to-end (INV-1 a INV-4)', () => {
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

  it('INV-1: un evento con campos inconsistentes con su type nunca se persiste', async () => {
    await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ type: 'VEHICLE_VIEWED' }) // sin vehicleId
      .expect(400);

    // sanity: el mismo body con vehicleId sí persiste (confirma que el 400
    // de arriba fue por la inconsistencia, no por otra cosa)
    const res = await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ type: 'VEHICLE_VIEWED', vehicleId: 777001 })
      .expect(201);
    createdEventIds.push(res.body.id);
  });

  it('INV-2: publicar un Lead resulta en exactamente un AnalyticsEvent LEAD_SUBMITTED con el vehicleIds correcto', async () => {
    const leadRes = await request(app.getHttpServer())
      .post('/leads')
      .send({
        firstName: 'INV2',
        lastName: 'Test',
        phone: '+58 412 7770002',
        vehicleIds: [777002, 777003],
      })
      .expect(201);
    createdLeadIds.push(leadRes.body.id);

    // el listener corre async sobre el mismo event loop del proceso de test;
    // un poll corto es más robusto que un sleep fijo.
    let matching: unknown[] = [];
    for (let attempt = 0; attempt < 20 && matching.length === 0; attempt++) {
      matching = await prisma.analyticsEvent.findMany({
        where: { type: 'LEAD_SUBMITTED', metadata: { path: ['leadId'], equals: leadRes.body.id } },
      });
      if (matching.length === 0) await new Promise((r) => setTimeout(r, 50));
    }

    expect(matching).toHaveLength(1);
    const analyticsEvent = matching[0] as { id: number; vehicleIds: number[] };
    createdEventIds.push(analyticsEvent.id);
    expect(analyticsEvent.vehicleIds).toEqual([777002, 777003]);
  });

  it('INV-3: el Dashboard nunca cuenta un mismo evento más de una vez', async () => {
    const res = await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ type: 'COMPARISON_PERFORMED', vehicleIds: [777004, 777005, 777006] })
      .expect(201);
    createdEventIds.push(res.body.id);

    const dashboard = await request(app.getHttpServer())
      .get('/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // un COMPARISON_PERFORMED de 3 vehículos genera exactamente 3 pares
    // (777004-777005, 777004-777006, 777005-777006), cada uno una sola vez.
    const relevantPairs = dashboard.body.topPairs.filter((p: { vehicleIds: number[] }) =>
      p.vehicleIds.every((id) => [777004, 777005, 777006].includes(id)),
    );
    expect(relevantPairs).toHaveLength(3);
    expect(relevantPairs.every((p: { count: number }) => p.count === 1)).toBe(true);

    const relevantCompared = dashboard.body.topCompared.filter((v: { vehicleId: number }) =>
      [777004, 777005, 777006].includes(v.vehicleId),
    );
    expect(relevantCompared.every((v: { count: number }) => v.count === 1)).toBe(true);
  });

  it('INV-4: no existe ningún path de escritura que modifique un AnalyticsEvent existente', async () => {
    const res = await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ type: 'VEHICLE_VIEWED', vehicleId: 777007 })
      .expect(201);
    createdEventIds.push(res.body.id);

    await request(app.getHttpServer())
      .patch(`/analytics/events/${res.body.id}`)
      .send({ vehicleId: 999999 })
      .expect(404);

    await request(app.getHttpServer())
      .put(`/analytics/events/${res.body.id}`)
      .send({ vehicleId: 999999 })
      .expect(404);

    const row = await prisma.analyticsEvent.findUnique({ where: { id: res.body.id } });
    expect(row?.vehicleId).toBe(777007);
  });
});
