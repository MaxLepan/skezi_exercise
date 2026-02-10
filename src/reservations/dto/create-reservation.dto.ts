import { Type } from "class-transformer";
import { IsDate, IsInt, MinDate } from "class-validator";

export class CreateReservationDto {
    @IsInt()
    roomId: number;

    @Type(() => Date)
    @IsDate()
    startAt: Date;

    @Type(() => Date)
    @IsDate()
    endAt: Date;
}