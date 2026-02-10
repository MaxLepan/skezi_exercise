import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';

type MockPrismaService = {
    room: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
    }
}

describe('RoomsService', () => {
  let service: RoomsService;

  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockPrismaService: MockPrismaService = {
        room: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = moduleRef.get(RoomsService);
    prismaMock = moduleRef.get(PrismaService);
  });

  describe('create', () => {
    it('should create and return a room', async () => {
      const createdRoom = {
        id: 1,
        name: 'Room A',
        maxCapacity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.room.create.mockResolvedValue(createdRoom);

      const result = await service.create({ name: 'Room A', maxCapacity: 10 });

      expect(result).toEqual(createdRoom);
      expect(prismaMock.room.create).toHaveBeenCalledWith({
        data: { name: 'Room A', maxCapacity: 10 },
      });
    });

    it('should throw ConflictException when name is not unique (P2002)', async () => {
      prismaMock.room.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create({ name: 'Room A', maxCapacity: 10 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a room when it exists', async () => {
      const room = {
        id: 42,
        name: 'Room 42',
        maxCapacity: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.room.findUnique.mockResolvedValue(room);

      const result = await service.findOne(42);

      expect(result).toEqual(room);
      expect(prismaMock.room.findUnique).toHaveBeenCalledWith({ where: { id: 42 } });
    });

    it('should throw NotFoundException when room does not exist', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);

      await expect(service.findOne(123)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.room.findUnique).toHaveBeenCalledWith({ where: { id: 123 } });
    });
  });

  describe('findAll', () => {
    it('should return an array of rooms ordered by name', async () => {
      const rooms = [
        { id: 1, name: 'A', maxCapacity: 10, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'B', maxCapacity: 8, createdAt: new Date(), updatedAt: new Date() },
      ];

      prismaMock.room.findMany.mockResolvedValue(rooms);

      const result = await service.findAll();

      expect(result).toEqual(rooms);
      expect(prismaMock.room.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });
});
