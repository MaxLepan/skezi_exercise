import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityQueryDto {
  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @Type(() => Date)
  @IsDate()
  endAt: Date;
}
