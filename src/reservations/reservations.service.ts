import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma, Reservation } from "../generated/prisma/client";

@Injectable()
export class ReservationsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: {
        roomId: number;
        userId: number;
        startAt: Date;
        endAt: Date;
    }): Promise<Reservation> {
        const now = new Date();

        if (data.startAt <= now) {
            throw new BadRequestException("Start time cannot be in the past.");
        }

        if (data.endAt <= data.startAt) {
            throw new BadRequestException("End time must be after start time.");
        }

        return this.prisma.$transaction(async (prisma) => {
            const lockedRoomsRows = await prisma.$queryRaw<Array<{ id: number }>>`SELECT id FROM "Room" WHERE id = ${data.roomId} FOR UPDATE`;

            if (lockedRoomsRows.length === 0) {
                throw new NotFoundException(`Room with ID ${data.roomId} not found.`);
            }

            const overlap = await prisma.reservation.findFirst({
                where: {
                    roomId: data.roomId,
                    startAt: { lt: data.endAt },
                    endAt: { gt: data.startAt },
                },
                select: { id: true },
            })

            if (overlap) {
                throw new ConflictException("The room is already reserved for the selected time slot.");
            }

            return prisma.reservation.create({
                data: {
                    room: { connect: { id: data.roomId } },
                    user: { connect: { id: data.userId } },
                    startAt: data.startAt,
                    endAt: data.endAt,
                } satisfies Prisma.ReservationCreateInput,
            });
        })
    }

    async findAll(): Promise<Reservation[]> {
        return this.prisma.reservation.findMany({
            orderBy: { startAt: "asc" },
        });
    }

    async findOne(id: number): Promise<Reservation> {
        const reservation = await this.prisma.reservation.findUnique({ where: { id } });
        if (!reservation) {
            throw new NotFoundException(`Reservation with ID ${id} not found.`);
        }
        return reservation;
    }

    async findByUserId(userId: number, from?: Date, to?: Date): Promise<Reservation[]> {
        return this.prisma.reservation.findMany({
            where: {
                userId,
                ...(from || to
                    ? {
                        startAt: { gte: from },
                        endAt: { lte: to },
                    }
                    : {}
                ),
            },
            orderBy: { startAt: "asc" },
        })
    }

    async cancel(id: number, userId: number) {
        const reservation = await this.prisma.reservation.findUnique({ where: { id } });

        if (!reservation) {
            throw new NotFoundException(`Reservation with ID ${id} not found.`);
        }
        if (reservation.userId !== userId) {
            throw new BadRequestException("You can only cancel your own reservations.");
        }

        await this.prisma.reservation.delete({ where: { id } });
    }

}