import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { LeadSubmittedEvent } from '../modules/leads/domain/events/lead-submitted.event';
import { PrismaService } from '../prisma/prisma.service';

// Tracer-bullet e2e: composición real de Nest (AppModule sin overrides),
// Postgres real vía Prisma — cierra el PRD de Leads probando las 4
// End-to-End Invariants contra el sistema tal como corre en producción.
describe('Leads — invariantes end-to-end (INV-1 a INV-4)', () => {
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
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+58 412 1234567',
      vehicleIds: [1, 2],
      ...overrides,
    };
  }

  it('INV-1: un Lead con vehicleIds vacío nunca se persiste', async () => {
    const before = await prisma.lead.count();

    await request(app.getHttpServer())
      .post('/leads')
      .send(baseLead({ vehicleIds: [] }))
      .expect(400);

    expect(await prisma.lead.count()).toBe(before);
  });

  it('INV-2: crear un Lead exitosamente dispara exactamente un LeadSubmittedEvent con el leadId y vehicleIds correctos', async () => {
    const eventBus = app.get(EventBus);
    const captured: LeadSubmittedEvent[] = [];
    const subscription = eventBus.subscribe((event) => {
      if (event instanceof LeadSubmittedEvent) captured.push(event);
    });

    const res = await request(app.getHttpServer())
      .post('/leads')
      .send(baseLead({ vehicleIds: [3, 4] }))
      .expect(201);
    createdIds.push(res.body.id);

    subscription.unsubscribe();

    expect(captured).toHaveLength(1);
    expect(captured[0].leadId).toBe(res.body.id);
    expect(captured[0].vehicleIds).toEqual([3, 4]);
  });

  it('INV-3: el Estado nunca retrocede ni salta entre CONVERTIDO y DESCARTADO', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/leads')
      .send(baseLead())
      .expect(201);
    const id = createRes.body.id;
    createdIds.push(id);

    await request(app.getHttpServer())
      .patch(`/leads/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTADO' })
      .expect(200);

    // retroceso: CONTACTADO -> NUEVO
    await request(app.getHttpServer())
      .patch(`/leads/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'NUEVO' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/leads/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONVERTIDO' })
      .expect(200);

    // salto entre finales: CONVERTIDO -> DESCARTADO
    await request(app.getHttpServer())
      .patch(`/leads/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DESCARTADO' })
      .expect(400);

    const row = await prisma.lead.findUnique({ where: { id } });
    expect(row?.status).toBe('CONVERTIDO');
  });

  it('INV-4: los datos de contacto y la Comparación asociada nunca cambian tras un cambio de Estado', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/leads')
      .send(baseLead({ firstName: 'Ana', lastName: 'Gómez', phone: '+58 414 9999999', vehicleIds: [5, 6] }))
      .expect(201);
    const id = createRes.body.id;
    createdIds.push(id);

    const before = await prisma.lead.findUnique({ where: { id } });

    await request(app.getHttpServer())
      .patch(`/leads/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTADO' })
      .expect(200);

    const after = await prisma.lead.findUnique({ where: { id } });

    expect(after?.firstName).toBe(before?.firstName);
    expect(after?.lastName).toBe(before?.lastName);
    expect(after?.phone).toBe(before?.phone);
    expect(after?.vehicleIds).toEqual(before?.vehicleIds);
    expect(after?.status).not.toBe(before?.status);
  });
});
