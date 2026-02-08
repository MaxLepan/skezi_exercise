import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReservationsService (unit)', () => {
  let service: ReservationsService;

  const txPrismaMock = {
    $queryRaw: jest.fn(),
    reservation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const prismaMock = {
    $transaction: jest.fn(async (fn: any) => fn(txPrismaMock)),
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(ReservationsService);
  });

  describe('create', () => {
    it('throws BadRequestException when startAt is in the past', async () => {
      await expect(
        service.create({
          roomId: 1,
          userId: 1,
          startAt: new Date(Date.now() - 60_000),
          endAt: new Date(Date.now() + 60_000),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when endAt <= startAt', async () => {
      const start = new Date(Date.now() + 60_000);
      const end = new Date(start.getTime());

      await expect(
        service.create({
          roomId: 1,
          userId: 1,
          startAt: start,
          endAt: end,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when room does not exist', async () => {
      txPrismaMock.$queryRaw.mockResolvedValue([]);

      const start = new Date(Date.now() + 60_000);
      const end = new Date(Date.now() + 120_000);

      await expect(
        service.create({ roomId: 999, userId: 1, startAt: start, endAt: end }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when overlap exists', async () => {
      txPrismaMock.$queryRaw.mockResolvedValue([{ id: 1 }]);
      txPrismaMock.reservation.findFirst.mockResolvedValue({ id: 123 });

      const start = new Date(Date.now() + 60_000);
      const end = new Date(Date.now() + 120_000);

      await expect(
        service.create({ roomId: 1, userId: 1, startAt: start, endAt: end }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates reservation when no overlap', async () => {
      txPrismaMock.$queryRaw.mockResolvedValue([{ id: 1 }]);
      txPrismaMock.reservation.findFirst.mockResolvedValue(null);
      txPrismaMock.reservation.create.mockResolvedValue({
        id: 1,
        roomId: 1,
        userId: 1,
        startAt: new Date(),
        endAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const start = new Date(Date.now() + 60_000);
      const end = new Date(Date.now() + 120_000);

      const result = await service.create({ roomId: 1, userId: 1, startAt: start, endAt: end });

      expect(txPrismaMock.reservation.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('cancel', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);

      await expect(service.cancel(123, 1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when not owner', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        roomId: 1,
        startAt: new Date(),
        endAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.cancel(1, 1)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
