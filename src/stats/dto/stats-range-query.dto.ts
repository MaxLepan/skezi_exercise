import { IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class StatsRangeQueryDto {
  @IsIn(['day', 'week', 'month'])
  period: 'day' | 'week' | 'month';

  @Type(() => Date)
  @IsDate()
  from: Date;

  @Type(() => Date)
  @IsDate()
  to: Date;
}
