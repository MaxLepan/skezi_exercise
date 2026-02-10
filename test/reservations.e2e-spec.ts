import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Reservations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {    
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('auth + create + overlap + past + ownership', async () => {
    // 1) register user1
    const email1 = `u1_${Date.now()}@test.com`;
    const password = 'password123';

    const reg1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: email1, password, firstName: 'A', lastName: 'B' })
      .expect(201);

    const token1 = reg1.body.access_token;
    expect(typeof token1).toBe('string');

    // 2) create room (public)
    const roomRes = await request(app.getHttpServer())
      .post('/rooms')
      .send({ name: `Room-${Date.now()}`, maxCapacity: 10 })
      .expect(201);

    const roomId: number = roomRes.body.id;
    expect(typeof roomId).toBe('number');

    // 3) create reservation OK
    const start1 = new Date(Date.now() + 60_000).toISOString();
    const end1 = new Date(Date.now() + 120_000).toISOString();

    const r1 = await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${token1}`)
      .send({ roomId, startAt: start1, endAt: end1 })
      .expect(201);

    const reservationId: number = r1.body.id;
    expect(typeof reservationId).toBe('number');

    // 4) overlapping reservation => 409
    const start2 = new Date(Date.now() + 90_000).toISOString();
    const end2 = new Date(Date.now() + 150_000).toISOString();

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${token1}`)
      .send({ roomId, startAt: start2, endAt: end2 })
      .expect(409);

    // 5) past reservation => 400
    const pastStart = new Date(Date.now() - 120_000).toISOString();
    const pastEnd = new Date(Date.now() - 60_000).toISOString();

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${token1}`)
      .send({ roomId, startAt: pastStart, endAt: pastEnd })
      .expect(400);

    // 6) register user2
    const email2 = `u2_${Date.now()}@test.com`;
    const reg2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: email2, password, firstName: 'C', lastName: 'D' })
      .expect(201);

    const token2 = reg2.body.access_token;

    // 7) user2 cannot cancel user1 reservation => 403
    await request(app.getHttpServer())
      .delete(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(403);
  });
});
