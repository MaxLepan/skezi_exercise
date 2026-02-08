import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { Reservation } from "src/generated/prisma/client";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

type AuthedRequest = Request & { user: { userId: number; email: string } };

@Controller("reservations")
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() dto: CreateReservationDto, @Req() req: AuthedRequest): Promise<Reservation> {
        return this.reservationsService.create({
            roomId: dto.roomId,
            userId: req.user.userId,
            startAt: dto.startAt,
            endAt: dto.endAt,
        });
    }


}