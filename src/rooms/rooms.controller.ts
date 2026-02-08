import { Body, Controller, Get, Param, Post, ParseIntPipe } from "@nestjs/common";
import { Room } from "src/generated/prisma/client";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";

@Controller("rooms")
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

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

}