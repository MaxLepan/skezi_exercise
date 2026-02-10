import { Body, Controller, Get, Param, Post, ParseIntPipe, Query } from "@nestjs/common";
import { Room } from "src/generated/prisma/client";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { AvailabilityQueryDto } from "./dto/availibility-query.dto";
import { RoomReservationsQueryDto } from "./dto/rooms-reservations-query.dto";

@Controller("rooms")
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Post()
    async create(@Body() dto: CreateRoomDto): Promise<Room> {
        return this.roomsService.create({
            name: dto.name,
            maxCapacity: dto.maxCapacity,
        })
    }

    @Get()
    async findAll(): Promise<Room[]> {
        return this.roomsService.findAll();
    }

    @Get(":id")
    async findOne(@Param("id", ParseIntPipe) id: number): Promise<Room> {
        return this.roomsService.findOne(id);
    }

    @Get(":id/availability")
    async checkAvailability(
        @Param("id", ParseIntPipe) id: number,
        @Query() q: AvailabilityQueryDto
    ): Promise<{ available: boolean }> {
        return this.roomsService.isAvailable(id, q.startAt, q.endAt);
    }

    @Get(":id/reservations")
    async reservationsForRoom(
        @Param('id', ParseIntPipe) id: number,
        @Query() q: RoomReservationsQueryDto,
    ) {
        return this.roomsService.reservationsForRoom(id, q.from, q.to);
    }
}