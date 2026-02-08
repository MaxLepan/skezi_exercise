import { Body, Controller, Post } from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { Reservation } from "src/generated/prisma/client";

@Controller("reservations")
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) {}

    @Post()
    async create(@Body() dto: CreateReservationDto): Promise<Reservation> {
        return this.reservationsService.create({
            roomId: dto.roomId,
            userId: 1, // TODO: get from auth
            startAt: dto.startAt,
            endAt: dto.endAt,
        });
    }

    
}