import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { Reservation } from "src/generated/prisma/client";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { getUserIdReservationsDto } from "./dto/get-userid-reservations.dto";

type AuthedRequest = Request & { user: { userId: number; email: string } };

@UseGuards(JwtAuthGuard)
@Controller("reservations")
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) {}

    @Post()
    async create(@Body() dto: CreateReservationDto, @Req() req: AuthedRequest): Promise<Reservation> {
        return this.reservationsService.create({
            roomId: dto.roomId,
            userId: req.user.userId,
            startAt: dto.startAt,
            endAt: dto.endAt,
        });
    }

    @Get("me")
    async findMyReservations(@Req() req: AuthedRequest, @Query() q: getUserIdReservationsDto): Promise<Reservation[]> {
        return this.reservationsService.findByUserId(req.user.userId, q.from, q.to);
    }
}