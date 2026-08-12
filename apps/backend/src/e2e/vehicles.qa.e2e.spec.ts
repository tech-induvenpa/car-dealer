import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// QA smoke — cierra los huecos de cobertura HTTP/auth que sólo se habían
// verificado a mano con curl durante la implementación (no como test de
// regresión). Complementa vehicle-invariants.e2e.spec.ts, que cubre INV-1..7.
describe('Vehicles — QA smoke (HTTP + auth, criterios de aceptación por ticket)', () => {
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
      await prisma.vehicle.deleteMany({ where: { id: { in: createdIds } } });
    }
    await app.close();
  });

  function baseVehicle(overrides: Record<string, unknown> = {}) {
    return {
      brand: 'CHANGAN',
      model: 'QA Test',
      trim: 'Premium',
      year: 2024,
      price: 20000,
      mainImageUrl: 'https://example.com/x.jpg',
      category: 'SUV',
      specs: {
        fuelType: 'GASOLINA',
        transmissionType: 'CVT',
        driveType: 'AWD_4X4',
        hasAbs: true,
        hasStabilityControl: true,
        hasRearCamera: true,
        hasBluetooth: true,
        hasCarPlay: true,
        highlights: [],
      },
      ...overrides,
    };
  }

  async function createVehicle(overrides: Record<string, unknown> = {}): Promise<number> {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(baseVehicle(overrides))
      .expect(201);
    createdIds.push(res.body.id);
    return res.body.id;
  }

  // CEB-10
  it('POST /vehicles con datos válidos persiste y devuelve 201 + id', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(baseVehicle({ model: 'CEB-10 create' }))
      .expect(201);
    expect(res.body.id).toEqual(expect.any(Number));
    createdIds.push(res.body.id);
  });

  it('POST /vehicles sin JWT devuelve 401', async () => {
    await request(app.getHttpServer()).post('/vehicles').send(baseVehicle()).expect(401);
  });

  // CEB-11
  it('PATCH /vehicles/:id con datos válidos reemplaza la ficha completa', async () => {
    const id = await createVehicle({ model: 'CEB-11 antes', price: 20000 });
    await request(app.getHttpServer())
      .patch(`/vehicles/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(baseVehicle({ model: 'CEB-11 después', price: 25000 }))
      .expect(200);

    const row = await prisma.vehicle.findUnique({ where: { id } });
    expect(row?.model).toBe('CEB-11 después');
    expect(Number(row?.price)).toBe(25000);
  });

  it('PATCH /vehicles/:id sobre un id inexistente devuelve 404', async () => {
    await request(app.getHttpServer())
      .patch('/vehicles/999999')
      .set('Authorization', `Bearer ${token}`)
      .send(baseVehicle())
      .expect(404);
  });

  it('PATCH /vehicles/:id sin JWT devuelve 401', async () => {
    const id = await createVehicle({ model: 'CEB-11 401' });
    await request(app.getHttpServer()).patch(`/vehicles/${id}`).send(baseVehicle()).expect(401);
  });

  // CEB-12
  it('POST /vehicles/:id/archive y /publish sin JWT devuelven 401', async () => {
    const id = await createVehicle({ model: 'CEB-12 401' });
    await request(app.getHttpServer()).post(`/vehicles/${id}/archive`).expect(401);
    await request(app.getHttpServer()).post(`/vehicles/${id}/publish`).expect(401);
  });

  // CEB-13
  it('GET /vehicles combina filtros brand+category+search correctamente', async () => {
    const matchId = await createVehicle({
      brand: 'CHANGAN',
      model: 'CEB-13 CS35 Plus',
      category: 'SUV',
    });
    await createVehicle({ brand: 'TOYOTA', model: 'CEB-13 Corolla', category: 'SUV' });
    await createVehicle({ brand: 'CHANGAN', model: 'CEB-13 Otro', category: 'COMPACTO' });

    const res = await request(app.getHttpServer())
      .get('/vehicles?brand=CHANGAN&category=SUV&search=CS35')
      .expect(200);

    expect(res.body.map((v: { id: number }) => v.id)).toEqual([matchId]);
  });

  it('GET /vehicles/:id de un archivado devuelve 404 en la ruta pública y 200 autenticado', async () => {
    const id = await createVehicle({ model: 'CEB-13 archivado' });
    await request(app.getHttpServer())
      .post(`/vehicles/${id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer()).get(`/vehicles/${id}`).expect(404);

    const authedRes = await request(app.getHttpServer())
      .get(`/vehicles/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(authedRes.body.id).toBe(id);
    expect(authedRes.body.isPublished).toBe(false);
  });

  it('GET /vehicles/:id de un id inexistente devuelve 404', async () => {
    await request(app.getHttpServer()).get('/vehicles/999999').expect(404);
  });

  // CEB-15
  it('POST /vehicles/import acepta CSV crudo (Content-Type: text/csv)', async () => {
    const csv =
      'brand,model,trim,year,price,mainImageUrl,category,fuelType,transmissionType,driveType,hasAbs,hasStabilityControl,hasRearCamera,hasBluetooth,hasCarPlay,highlights\n' +
      'CHANGAN,CEB-15 QA CSV,Premium,2024,22000,https://example.com/x.jpg,SUV,GASOLINA,CVT,AWD_4X4,true,true,true,true,false,Sunroof';

    const res = await request(app.getHttpServer())
      .post('/vehicles/import')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'text/csv')
      .send(csv)
      .expect(201);

    expect(res.body.inserted).toBe(1);
    expect(res.body.errors).toEqual([]);

    const row = await prisma.vehicle.findFirst({ where: { model: 'CEB-15 QA CSV' } });
    expect(row).not.toBeNull();
    createdIds.push(row!.id);
  });

  it('POST /vehicles/import sin JWT devuelve 401', async () => {
    await request(app.getHttpServer())
      .post('/vehicles/import')
      .send([baseVehicle()])
      .expect(401);
  });
});
