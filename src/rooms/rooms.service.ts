import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Room, Prisma } from "../generated/prisma/client";

@Injectable()
export class RoomsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.RoomCreateInput): Promise<Room> {
        try {
            return await this.prisma.room.create({ data });
        } catch (error: any) {
            if (error?.code === "P2002") {
                throw new ConflictException("A room with this name already exists.");
            }
            throw error;
        }
    }

    async findAll(): Promise<Room[]> {
        return this.prisma.room.findMany({
            orderBy: { name: "asc" },
        });
    }

    async findOne(id: number): Promise<Room> {
        const room = await this.prisma.room.findUnique({ where: { id } });
        if (!room) {
            throw new NotFoundException(`Room with ID ${id} not found.`);
        }
        return room;
    }

    async isAvailable(roomId: number, startAt: Date, endAt: Date): Promise<{ available: boolean }> {
        const overlap = await this.prisma.reservation.findFirst({
            where: {
                roomId,
                startAt: { lt: endAt },
                endAt: { gt: startAt },

            },
            select: { id: true },
        });
        return { available: !overlap };
    }

    async reservationsForRoom(roomId: number, from?: Date, to?: Date) {
        return this.prisma.reservation.findMany({
            where: {
                roomId,
                ...(from && to
                    ? { startAt: { lt: to }, endAt: { gt: from } }
                    : from
                        ? { endAt: { gt: from } }
                        : to
                            ? { startAt: { lt: to } }
                            : {}),
            },
            orderBy: { startAt: 'asc' },
        });
    }

}