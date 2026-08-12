import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';
import { PrismaService } from '../prisma/prisma.service';

// Tracer-bullet e2e: composición real de Nest (AppModule sin overrides),
// Postgres real vía Prisma — cierra el PRD de Catalog (Vehicles) probando
// las 7 End-to-End Invariants contra el sistema tal como corre en producción,
// no contra los specs unitarios de cada slice por separado.
describe('Vehicles — invariantes end-to-end (INV-1 a INV-7)', () => {
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
      model: 'INV Test',
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

  it('INV-3: un vehículo con price <= 0 nunca se persiste (alta individual)', async () => {
    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(baseVehicle({ model: 'INV-3 individual', price: 0 }))
      .expect(400);

    const row = await prisma.vehicle.findFirst({ where: { model: 'INV-3 individual' } });
    expect(row).toBeNull();
  });

  it('INV-3 + INV-4: import masivo nunca persiste price <= 0, ni bloquea las filas válidas del lote', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles/import')
      .set('Authorization', `Bearer ${token}`)
      .send([
        baseVehicle({ model: 'INV-4 válida' }),
        baseVehicle({ model: 'INV-3 import', price: 0 }),
      ])
      .expect(201);

    expect(res.body.inserted).toBe(1);
    expect(res.body.errors).toHaveLength(1);

    const validRow = await prisma.vehicle.findFirst({ where: { model: 'INV-4 válida' } });
    expect(validRow).not.toBeNull();
    createdIds.push(validRow!.id);

    const invalidRow = await prisma.vehicle.findFirst({ where: { model: 'INV-3 import' } });
    expect(invalidRow).toBeNull();
  });

  it('INV-1 + INV-7: el catálogo público nunca devuelve un archivado, y archivar nunca borra el registro', async () => {
    const id = await createVehicle({ model: 'INV-1 y 7' });

    await request(app.getHttpServer())
      .post(`/vehicles/${id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const list = await request(app.getHttpServer()).get('/vehicles').expect(200);
    expect(list.body.some((v: { id: number }) => v.id === id)).toBe(false);

    await request(app.getHttpServer()).get(`/vehicles/${id}`).expect(404);

    const row = await prisma.vehicle.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row!.isPublished).toBe(false);
  });

  it('INV-2: la comparación nunca incluye un vehículo archivado', async () => {
    const publishedId = await createVehicle({ model: 'INV-2 publicado' });
    const archivedId = await createVehicle({ model: 'INV-2 archivado' });
    await request(app.getHttpServer())
      .post(`/vehicles/${archivedId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/vehicles/compare?ids=${publishedId},${archivedId}`)
      .expect(200);

    expect(res.body.vehicles.map((v: { id: number }) => v.id)).toEqual([publishedId]);
  });

  it('INV-5: el Ganador de comparación solo aparece en campos con dirección definida', async () => {
    const id1 = await createVehicle({
      model: 'INV-5 A',
      specs: { ...baseVehicle().specs, horsepowerHp: 130, transmissionType: 'CVT' },
    });
    const id2 = await createVehicle({
      model: 'INV-5 B',
      specs: { ...baseVehicle().specs, horsepowerHp: 200, transmissionType: 'AUTOMATICA' },
    });

    const res = await request(app.getHttpServer())
      .get(`/vehicles/compare?ids=${id1},${id2}`)
      .expect(200);

    expect(res.body.winners.horsepowerHp).toEqual([id2]);
    expect(res.body.winners.transmissionType).toBeUndefined();
    expect(res.body.winners.weightKg).toBeUndefined();
  });

  it('INV-6: la comparación de consumo usa fuelEconomyNormalizedKmPerL, nunca el valor crudo', async () => {
    // A: 10 L/100km -> normalizado = 100/10 = 10 km/L
    const idA = await createVehicle({
      model: 'INV-6 A',
      specs: { ...baseVehicle().specs, fuelEconomyValue: 10, fuelEconomyUnit: 'L_POR_100KM' },
    });
    // B: 18 km/gal -> normalizado ≈ 18/3.78541 = 4.76 km/L
    const idB = await createVehicle({
      model: 'INV-6 B',
      specs: { ...baseVehicle().specs, fuelEconomyValue: 18, fuelEconomyUnit: 'KM_POR_GAL' },
    });

    const res = await request(app.getHttpServer())
      .get(`/vehicles/compare?ids=${idA},${idB}`)
      .expect(200);

    // comparar el valor crudo (10 vs 18) habría dado B como ganador; el
    // normalizado da A — prueba que la policy usa el campo correcto.
    expect(res.body.winners.fuelEconomyNormalizedKmPerL).toEqual([idA]);
  });
});
