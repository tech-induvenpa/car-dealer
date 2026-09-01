import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Proof ticket (CEB-48): tracer-bullet e2e sobre composición real de Nest
// (AppModule sin overrides) y Postgres real.
//
// ponytail: acá vive SOLO lo que necesita el composition root real. Las
// otras invariantes (INV-1, INV-2, INV-4 a INV-7) se prueban de forma
// determinista en send-message.handler.spec.ts, contra la capa de reemplazo
// fijo que es la que efectivamente protege al comprador.
//
// Existieron acá como e2e contra el LLM real y se borraron: eran un eval del
// prompt disfrazado de test — una sola muestra, assert por substring, no
// determinista, ~100s y con costo por corrida. Lo que sí queda sin cubrir es
// si el LLM marca bien `boundaryViolation`; eso es un eval aparte, con varios
// casos y corrida a demanda, no un test de `npm test`.
describe('Agente conversacional — invariantes end-to-end (CEB-36)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdProfileIds: number[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (createdProfileIds.length > 0) await prisma.profile.deleteMany({ where: { id: { in: createdProfileIds } } });
    await app.close();
  });

  it('INV-3: un Perfil persiste con lo ya capturado, sin necesidad de que exista nunca un Lead', async () => {
    const sessionId = `e2e-inv3-${Date.now()}`;

    const res = await request(app.getHttpServer())
      .post('/profile/objections')
      .send({ sessionId, category: 'PRECIO', detail: 'le preocupa el precio' })
      .expect(201);
    createdProfileIds.push(res.body.id);

    const profile = await prisma.profile.findUnique({ where: { id: res.body.id } });
    expect(profile).not.toBeNull();
    expect(profile?.objections).toEqual([{ category: 'PRECIO', detail: 'le preocupa el precio' }]);

    const leadReferencing = await prisma.lead.findFirst({ where: { profileId: res.body.id } });
    expect(leadReferencing).toBeNull(); // nunca hubo Lead — el Perfil no depende de que exista uno.
  });
});
