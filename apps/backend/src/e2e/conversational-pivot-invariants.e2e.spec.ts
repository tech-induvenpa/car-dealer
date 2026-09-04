import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Proof ticket (CEB-88): tracer-bullet sobre el composition root REAL —
// AppModule sin un solo override de provider, Postgres real vía Prisma.
//
// No es un slice de feature: es la prueba de que los slices COMPONEN. Cada
// ticket puede estar verde por su cuenta y la garantía end-to-end no existir
// igual; un test de segmento no compone en una garantía de sistema.
//
// El adapter guionable se elige por LLM_PROVIDER=echo, el mismo mecanismo que
// usa producción para elegir proveedor — por eso no hace falta tocar el grafo
// de DI. Cuando el mensaje del comprador es un JSON de LlmReply, el adapter
// lo devuelve tal cual; si no, ecoa lo que el Agente sabía al armar el turno.
describe('Pivote conversacional — invariantes end-to-end (CEB-78)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const sessions: string[] = [];
  let vehicleAId: number;
  let vehicleBId: number;

  const scripted = (reply: Record<string, unknown>) => JSON.stringify(reply);

  const send = (sessionId: string, message: string, extra: Record<string, unknown> = {}) =>
    request(app.getHttpServer())
      .post('/agent/messages')
      .send({ sessionId, message, ...extra })
      .expect(201);

  // Omitir conversationId siempre abandona la ACTIVA previa y abre otra
  // (CEB-36-UI-01), así que un hilo de varios turnos tiene que encadenarlo.
  function thread(sessionId: string) {
    let conversationId: number | undefined;
    return async (message: string, extra: Record<string, unknown> = {}) => {
      const res = await send(sessionId, message, { ...extra, ...(conversationId ? { conversationId } : {}) });
      conversationId = res.body.conversationId as number;
      return res;
    };
  }

  beforeAll(async () => {
    process.env.LLM_PROVIDER = 'echo';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    // Dos Vehículos con un ganador inequívoco por campo: A gana potencia,
    // B gana consumo. Es lo que permite afirmar y refutar un Veredicto.
    const base = {
      brand: 'TOYOTA' as const,
      trim: 'XLI',
      year: 2024,
      mainImageUrl: 'https://example.test/car.png',
      category: 'SUV' as const,
      fuelType: 'GASOLINA' as const,
      transmissionType: 'CVT' as const,
      driveType: 'FWD_4X2' as const,
      isPublished: true,
    };
    const a = await prisma.vehicle.create({
      data: { ...base, model: `E2E-A-${Date.now()}`, price: 32900, horsepowerHp: 169, fuelEconomyNormalizedKmPerL: 14.2 },
    });
    const b = await prisma.vehicle.create({
      data: { ...base, model: `E2E-B-${Date.now()}`, price: 29500, horsepowerHp: 145, fuelEconomyNormalizedKmPerL: 16.8 },
    });
    vehicleAId = a.id;
    vehicleBId = b.id;
  });

  afterAll(async () => {
    if (sessions.length > 0) {
      const profiles = await prisma.profile.findMany({ where: { sessionId: { in: sessions } } });
      await prisma.lead.deleteMany({ where: { profileId: { in: profiles.map((p) => p.id) } } });
      await prisma.profile.deleteMany({ where: { sessionId: { in: sessions } } });
      await prisma.conversation.deleteMany({ where: { sessionId: { in: sessions } } });
      await prisma.analyticsEvent.deleteMany({ where: { sessionId: { in: sessions } } });
    }
    await prisma.vehicle.deleteMany({ where: { id: { in: [vehicleAId, vehicleBId] } } });
    await app.close();
  });

  function newSession(tag: string): string {
    const sessionId = `e2e-ceb78-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessions.push(sessionId);
    return sessionId;
  }

  describe('INV-13 — un Perfil solo existe si el comprador declaró algo', () => {
    it('conversar sin declarar nada no deja Perfil en base', async () => {
      const sessionId = newSession('inv13');
      const turn = thread(sessionId);

      await turn('hola, estoy mirando nomás');
      await turn('nada en particular todavía');

      expect(await prisma.profile.findUnique({ where: { sessionId } })).toBeNull();
      // La interacción no se pierde: vive en la Conversación, no en el Perfil.
      const conversations = await prisma.conversation.findMany({ where: { sessionId } });
      expect(conversations).toHaveLength(1);
      expect(conversations[0].turns).toHaveLength(2);
    });

    it('el primer hecho declarado sí materializa el Perfil', async () => {
      const sessionId = newSession('inv13b');

      await send(
        sessionId,
        scripted({ message: 'Anotado.', extractedNeed: { category: 'SUV', detail: 'familiar' } }),
      );

      const profile = await prisma.profile.findUnique({ where: { sessionId } });
      expect(profile).not.toBeNull();
      expect(profile?.needs).toHaveLength(1);
    });
  });

  describe('INV-12 — el Atajo se aplica antes de calcular la Etapa y de llamar al modelo', () => {
    it('el Agente ya conoce el hecho tapeado al armar ESE mismo turno', async () => {
      const sessionId = newSession('inv12');

      // El eco devuelve el profileSummary tal como el Agente lo recibió: si el
      // Atajo se aplicara después de llamar al modelo, esto vendría vacío y el
      // Agente repreguntaría lo que el comprador acaba de tapear.
      const res = await send(sessionId, 'Uso familiar', { shortcutId: 'uso-familiar' });

      expect(res.body.reply).toContain('"category":"SUV"');

      const profile = await prisma.profile.findUnique({ where: { sessionId } });
      expect(profile?.needs).toEqual([{ category: 'SUV', detail: 'capturado por un Atajo' }]);
    });

    it('el Atajo de presupuesto normaliza el tope igual que antes', async () => {
      const sessionId = newSession('inv12b');

      await send(sessionId, '$20.000 a $35.000', { shortcutId: 'presupuesto-20000-35000' });

      const profile = await prisma.profile.findUnique({ where: { sessionId } });
      expect(profile?.budgetMin).toBe(0);
      expect(profile?.budgetMax).toBe(35000);
    });

    it('un Atajo desconocido no rompe el turno: sigue como texto libre', async () => {
      const sessionId = newSession('inv12c');

      const res = await send(sessionId, 'algo cualquiera', { shortcutId: 'no-existe' });

      expect(res.body.conversationId).toEqual(expect.any(Number));
      expect(await prisma.profile.findUnique({ where: { sessionId } })).toBeNull();
    });
  });

  describe('INV-8 — un Veredicto entregado se sostiene en los Ganadores de comparación', () => {
    // Un Veredicto exige saber qué busca el comprador y cuánto puede gastar
    // (ver buyer-qualification.ts): sin eso no hay a quién recomendarle. Los
    // Atajos dejan el Perfil calificado de forma determinista, sin depender de
    // que el modelo extraiga bien.
    async function qualifiedThread(tag: string) {
      const sessionId = newSession(tag);
      const turn = thread(sessionId);
      await turn('Uso familiar', { shortcutId: 'uso-familiar' });
      await turn('$20.000 a $35.000', { shortcutId: 'presupuesto-20000-35000' });
      return { sessionId, turn };
    }

    it('descarta el Veredicto en la primera pregunta, cuando no se sabe nada del comprador', async () => {
      const sessionId = newSession('inv8-temprano');

      const res = await send(
        sessionId,
        scripted({
          message: 'Te recomiendo el B.',
          referencedVehicleIds: [vehicleAId, vehicleBId],
          proposedVerdict: {
            recommendedVehicleId: vehicleBId,
            decisiveField: 'fuelEconomyNormalizedKmPerL',
            reason: 'Rinde más.',
          },
        }),
      );

      // Los números son correctos —B gana consumo— pero no hay Perfil.
      expect(res.body.verdict).toBeNull();
    });

    it('entrega el Veredicto cuando el recomendado gana el Campo decisivo', async () => {
      const { turn } = await qualifiedThread('inv8-ok');

      const res = await turn(
        scripted({
          message: 'El B rinde más.',
          referencedVehicleIds: [vehicleAId, vehicleBId],
          proposedVerdict: {
            recommendedVehicleId: vehicleBId,
            decisiveField: 'fuelEconomyNormalizedKmPerL',
            reason: 'Rinde 2,6 km/L más.',
          },
        }),
      );

      expect(res.body.verdict).toEqual({
        recommendedVehicleId: vehicleBId,
        comparedVehicleIds: [vehicleAId, vehicleBId],
        decisiveField: 'fuelEconomyNormalizedKmPerL',
        reason: 'Rinde 2,6 km/L más.',
      });
    });

    it('descarta el Veredicto cuando el recomendado NO gana ese campo, y el turno sigue', async () => {
      const { sessionId, turn } = await qualifiedThread('inv8-falso');

      // La afirmación falsa que la regla existe para atajar: el consumo lo
      // gana B, pero el modelo recomienda A "por consumo".
      const res = await turn(
        scripted({
          message: 'Te recomiendo el A por consumo.',
          referencedVehicleIds: [vehicleAId, vehicleBId],
          proposedVerdict: {
            recommendedVehicleId: vehicleAId,
            decisiveField: 'fuelEconomyNormalizedKmPerL',
            reason: 'Rinde más.',
          },
        }),
      );

      expect(res.body.verdict).toBeNull();
      // El turno se entrega igual: la Conversación continúa, sin error visible.
      expect(res.body.reply).toBe('Te recomiendo el A por consumo.');
      const conversation = await prisma.conversation.findFirst({ where: { sessionId } });
      expect(conversation?.turns).toHaveLength(3);
      expect(conversation?.status).toBe('ACTIVA');
    });

    it('solo el Veredicto verificado deja rastro en Analytics', async () => {
      const verdictEvents = await prisma.analyticsEvent.findMany({
        where: { type: 'VERDICT_DELIVERED', vehicleIds: { hasEvery: [vehicleAId, vehicleBId] } },
      });
      // Se entregó uno solo de los dos veredictos propuestos arriba.
      expect(verdictEvents).toHaveLength(1);
      expect(verdictEvents[0].vehicleId).toBe(vehicleBId);
    });
  });

  describe('INV-9 — el Contacto ofrecido nunca se pierde', () => {
    it('con un Vehículo ya referenciado, el contacto se vuelve Lead en el acto', async () => {
      const sessionId = newSession('inv9-directo');
      const turn = thread(sessionId);

      await turn(scripted({ message: 'Mirá este.', referencedVehicleIds: [vehicleAId] }));
      await turn(
        scripted({
          message: 'Listo, te contactamos.',
          extractedContact: { firstName: 'Ana', lastName: 'Pérez', phone: '0414-1234567' },
        }),
      );

      const profile = await prisma.profile.findUnique({ where: { sessionId } });
      const lead = await prisma.lead.findFirst({ where: { profileId: profile?.id } });
      expect(lead?.phone).toBe('0414-1234567');
      expect(lead?.vehicleIds).toEqual([vehicleAId]);
    });

    it('sin Vehículo todavía, el contacto espera en el Perfil y el Lead se materializa después', async () => {
      const sessionId = newSession('inv9-diferido');
      const turn = thread(sessionId);

      // Turno 1: da el teléfono antes de que se hable de ningún vehículo.
      // Antes de CEB-85 esto se descartaba en silencio.
      await turn(
        scripted({
          message: 'Gracias.',
          extractedContact: { firstName: 'Beto', lastName: 'Gómez', phone: '0424-7654321' },
        }),
      );

      const profileAfterContact = await prisma.profile.findUnique({ where: { sessionId } });
      expect(profileAfterContact?.contactPhone).toBe('0424-7654321');
      expect(await prisma.lead.findFirst({ where: { profileId: profileAfterContact?.id } })).toBeNull();

      // Turno 2: aparece el primer Vehículo — el Lead se crea solo, sin que
      // el comprador vuelva a dar nada.
      await turn(scripted({ message: 'Te muestro este.', referencedVehicleIds: [vehicleBId] }));

      const lead = await prisma.lead.findFirst({ where: { profileId: profileAfterContact?.id } });
      expect(lead?.phone).toBe('0424-7654321');
      expect(lead?.vehicleIds).toEqual([vehicleBId]);
      // Un Lead sigue exigiendo al menos un Vehículo: la regla no se relajó.
      expect(lead?.vehicleIds.length).toBeGreaterThan(0);
    });

    it('no duplica el Lead en una Conversación posterior de la misma Sesión', async () => {
      const sessionId = newSession('inv9-sin-duplicar');

      await send(
        sessionId,
        scripted({
          message: 'Anotado.',
          referencedVehicleIds: [vehicleAId],
          extractedContact: { firstName: 'Cora', lastName: 'Díaz', phone: '0412-1112233' },
        }),
      );
      const profile = await prisma.profile.findUnique({ where: { sessionId } });
      expect(await prisma.lead.count({ where: { profileId: profile?.id } })).toBe(1);

      // Nueva Conversación (sin conversationId): el Perfil sigue teniendo el
      // Contacto, pero no debe volver a generar un Lead.
      await send(sessionId, scripted({ message: 'Otra vez.', referencedVehicleIds: [vehicleBId] }));

      expect(await prisma.lead.count({ where: { profileId: profile?.id } })).toBe(1);
    });
  });

  describe('Estado de la Conversación — empezar de nuevo empieza de nuevo', () => {
    it('el Agente deja de ver lo declarado en la Conversación anterior', async () => {
      // El bug reportado: se creaba una Conversación nueva y el Agente seguía
      // sabiendo el presupuesto del hilo viejo, y encima lo trataba como dicho
      // en el nuevo ("mencionaste...").
      const sessionId = newSession('estado');
      const turn = thread(sessionId);
      await turn('Uso familiar', { shortcutId: 'uso-familiar' });
      await turn('$20.000 a $35.000', { shortcutId: 'presupuesto-20000-35000' });

      const before = await prisma.profile.findUnique({ where: { sessionId } });
      expect(before?.needs).toHaveLength(1);
      expect(before?.budgetMax).toBe(35000);

      await request(app.getHttpServer())
        .post('/agent/conversations/new')
        .send({ sessionId })
        .expect(201);

      // El Perfil sigue existiendo pero sin lo declarado.
      const after = await prisma.profile.findUnique({ where: { sessionId } });
      expect(after?.needs).toEqual([]);
      expect(after?.budgetMin).toBeNull();
      expect(after?.budgetMax).toBeNull();

      // Y la Conversación previa quedó abandonada, no colgando como ACTIVA.
      const conversations = await prisma.conversation.findMany({ where: { sessionId } });
      expect(conversations.every((c) => c.status !== 'ACTIVA')).toBe(true);

      // El turno siguiente arranca sin nada: el eco devuelve el profileSummary
      // que recibió el Agente.
      const res = await send(sessionId, 'hola de nuevo');
      expect(res.body.reply).toContain('"needs":[]');
      expect(res.body.reply).toContain('"budgetRange":null');
    });

    it('empezar de nuevo no borra el Contacto ya ofrecido', async () => {
      const sessionId = newSession('estado-contacto');
      const turn = thread(sessionId);
      await turn(
        scripted({
          message: 'Anotado.',
          extractedContact: { firstName: 'Dora', lastName: 'Luz', phone: '0416-5556677' },
        }),
      );

      await request(app.getHttpServer()).post('/agent/conversations/new').send({ sessionId }).expect(201);

      const profile = await prisma.profile.findUnique({ where: { sessionId } });
      expect(profile?.contactPhone).toBe('0416-5556677');
    });

    it('tapear un Atajo guarda el hecho UNA vez, no una por el Atajo y otra por el modelo', async () => {
      const sessionId = newSession('sin-duplicar-hecho');

      // El adapter guionado extrae lo mismo que el Atajo ya aplicó.
      await send(
        sessionId,
        scripted({ message: 'Familiar, anotado.', extractedNeed: { category: 'SUV', detail: 'uso familiar' } }),
        { shortcutId: 'uso-familiar' },
      );

      const profile = await prisma.profile.findUnique({ where: { sessionId } });
      expect(profile?.needs).toHaveLength(1);
    });
  });

});
