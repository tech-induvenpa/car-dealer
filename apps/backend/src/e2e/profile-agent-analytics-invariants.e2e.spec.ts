import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Tracer-bullet e2e: composición real de Nest (AppModule sin overrides),
// Postgres real vía Prisma — prueba CEB-45 (Profile/Agent -> Analytics
// reactivo, ADR-0004) contra el sistema tal como corre en producción.
//
// FUNNEL_STAGE_REACHED (agent/) no se prueba acá end-to-end: solo se
// dispara desde /agent/messages, que necesita credenciales reales de
// Vertex AI que no existen en este entorno — ver docs/adr/0011 y el
// listener unitario (funnel-stage-reached.listener.spec.ts) mientras tanto.
describe('Profile -> Analytics — invariantes end-to-end reactivos (CEB-45)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEventIds: number[] = [];
  const createdProfileIds: number[] = [];

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
    if (createdProfileIds.length > 0) {
      await prisma.profile.deleteMany({ where: { id: { in: createdProfileIds } } });
    }
    await app.close();
  });

  async function pollForAnalyticsEvent(
    type: string,
    matches: (metadata: Record<string, unknown>) => boolean,
  ): Promise<{ id: number; metadata: Record<string, unknown> } | undefined> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const rows = await prisma.analyticsEvent.findMany({ where: { type: type as never } });
      const found = rows.find((r) => matches(r.metadata as Record<string, unknown>));
      if (found) return found as { id: number; metadata: Record<string, unknown> };
      await new Promise((r) => setTimeout(r, 50));
    }
    return undefined;
  }

  it('capturar una Necesidad produce exactamente un AnalyticsEvent NEED_CAPTURED (no una llamada directa)', async () => {
    const sessionId = `e2e-need-${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/profile/needs')
      .send({ sessionId, category: 'SUV', detail: 'familia numerosa e2e' })
      .expect(201);
    createdProfileIds.push(res.body.id);

    const found = await pollForAnalyticsEvent('NEED_CAPTURED', (m) => m.profileId === res.body.id);

    expect(found).toBeDefined();
    createdEventIds.push(found!.id);
    expect(found!.metadata).toEqual({ profileId: res.body.id, category: 'SUV' });
  });

  it('capturar un Presupuesto produce exactamente un AnalyticsEvent BUDGET_CAPTURED', async () => {
    const sessionId = `e2e-budget-${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/profile/budget')
      .send({ sessionId, min: 0, max: 35000 })
      .expect(201);
    createdProfileIds.push(res.body.id);

    const found = await pollForAnalyticsEvent('BUDGET_CAPTURED', (m) => m.profileId === res.body.id);

    expect(found).toBeDefined();
    createdEventIds.push(found!.id);
    expect(found!.metadata).toEqual({ profileId: res.body.id, min: 0, max: 35000 });
  });

  it('capturar una Objeción produce exactamente un AnalyticsEvent OBJECTION_CAPTURED', async () => {
    const sessionId = `e2e-objection-${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/profile/objections')
      .send({ sessionId, category: 'PRECIO', detail: 'le parece caro e2e' })
      .expect(201);
    createdProfileIds.push(res.body.id);

    const found = await pollForAnalyticsEvent('OBJECTION_CAPTURED', (m) => m.profileId === res.body.id);

    expect(found).toBeDefined();
    createdEventIds.push(found!.id);
    expect(found!.metadata).toEqual({ profileId: res.body.id, category: 'PRECIO' });
  });

  it('capturar una Motivación produce exactamente un AnalyticsEvent MOTIVATION_CAPTURED', async () => {
    const sessionId = `e2e-motivation-${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/profile/motivations')
      .send({ sessionId, category: 'REEMPLAZO', detail: 'el carro actual ya no sirve' })
      .expect(201);
    createdProfileIds.push(res.body.id);

    const found = await pollForAnalyticsEvent('MOTIVATION_CAPTURED', (m) => m.profileId === res.body.id);

    expect(found).toBeDefined();
    createdEventIds.push(found!.id);
    expect(found!.metadata).toEqual({ profileId: res.body.id, category: 'REEMPLAZO' });
  });

  it('Profile y Agent no dependen de Analytics: no hay ningún import estático de analytics/ en esos módulos', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require('child_process');
    const output = execSync(
      "grep -rl \"from '.*analytics\" src/modules/profile src/modules/agent || true",
      { cwd: process.cwd() },
    ).toString();
    expect(output.trim()).toBe('');
  });
});
