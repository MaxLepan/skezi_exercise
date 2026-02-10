import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';
import { StatsRangeQueryDto } from './dto/stats-range-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('rooms/occupancy')
  roomsOccupancy(@Query() q: StatsRangeQueryDto) {
    return this.stats.roomsOccupancy(q.period, q.from, q.to);
  }

  @Get('rooms/top')
  topRooms(@Query() q: StatsRangeQueryDto & { limit?: string }) {
    const limit = q.limit ? Number(q.limit) : 3;
    return this.stats.topRooms(q.period, q.from, q.to, limit);
  }

  @Get('meetings/avg-duration')
  avgDuration(@Query() q: StatsRangeQueryDto) {
    return this.stats.avgMeetingDuration(q.period, q.from, q.to);
  }
}
