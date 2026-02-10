import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

type Period = 'day' | 'week' | 'month';

function toInterval(period: Period): Prisma.Sql {
    if (period === 'day') return Prisma.sql`interval '1 day'`;
    if (period === 'week') return Prisma.sql`interval '1 week'`;
    return Prisma.sql`interval '1 month'`;
}

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) { }

    async roomsOccupancy(period: 'day' | 'week' | 'month', from: Date, to: Date) {
  const step =
    period === 'day'
      ? Prisma.sql`interval '1 day'`
      : period === 'week'
        ? Prisma.sql`interval '1 week'`
        : Prisma.sql`interval '1 month'`;

  return this.prisma.$queryRaw<
    Array<{
      bucket_start: Date;
      bucket_end: Date;
      room_id: number;
      room_name: string;
      reserved_seconds: number;
      bucket_seconds: number;
      occupancy_rate: number;
    }>
  >(Prisma.sql`
    WITH buckets AS (
      SELECT
        bucket_start,
        bucket_start + ${step} AS bucket_end
      FROM generate_series(
        ${from}::timestamptz,
        (${to}::timestamptz - ${step}),
        ${step}
      ) AS bucket_start
    )
    SELECT
      b.bucket_start,
      b.bucket_end,
      r.id AS room_id,
      r.name AS room_name,

      COALESCE(
        SUM(
          CASE
            WHEN res.id IS NULL THEN 0
            ELSE GREATEST(
              0,
              EXTRACT(EPOCH FROM (
                LEAST(res."endAt", b.bucket_end) - GREATEST(res."startAt", b.bucket_start)
              ))
            )
          END
        ),
        0
      )::float8 AS reserved_seconds,

      EXTRACT(EPOCH FROM (b.bucket_end - b.bucket_start))::float8 AS bucket_seconds,

      CASE
        WHEN EXTRACT(EPOCH FROM (b.bucket_end - b.bucket_start)) = 0 THEN 0
        ELSE (
          COALESCE(
            SUM(
              CASE
                WHEN res.id IS NULL THEN 0
                ELSE GREATEST(
                  0,
                  EXTRACT(EPOCH FROM (
                    LEAST(res."endAt", b.bucket_end) - GREATEST(res."startAt", b.bucket_start)
                  ))
                )
              END
            ),
            0
          )
          / EXTRACT(EPOCH FROM (b.bucket_end - b.bucket_start))
        )
      END AS occupancy_rate

    FROM buckets b
    CROSS JOIN "Room" r
    LEFT JOIN "Reservation" res
      ON res."roomId" = r.id
      AND res."startAt" < b.bucket_end
      AND res."endAt" > b.bucket_start

    GROUP BY b.bucket_start, b.bucket_end, r.id, r.name
    ORDER BY b.bucket_start ASC, r.name ASC
  `);
}



    async topRooms(period: Period, from: Date, to: Date, limit = 3) {
        return this.prisma.$queryRaw<
            Array<{
                room_id: number;
                room_name: string;
                reservation_count: number;
            }>
        >(Prisma.sql`
      SELECT
        r.id AS room_id,
        r.name AS room_name,
        COUNT(res.id)::int AS reservation_count
      FROM "Room" r
      LEFT JOIN "Reservation" res
        ON res."roomId" = r.id
        AND res."startAt" < ${to}::timestamptz
        AND res."endAt" > ${from}::timestamptz
      GROUP BY r.id, r.name
      ORDER BY reservation_count DESC, room_name ASC
      LIMIT ${limit}
    `);
    }

    async avgMeetingDuration(period: Period, from: Date, to: Date) {
        const step = toInterval(period);

        return this.prisma.$queryRaw<
            Array<{
                bucket_start: Date;
                bucket_end: Date;
                avg_minutes: number | null;
                count: number;
            }>
        >(Prisma.sql`
      WITH buckets AS (
        SELECT
          gs AS bucket_start,
          gs + ${step} AS bucket_end
        FROM generate_series(${from}::timestamptz, ${to}::timestamptz - ${step}, ${step}) AS gs
      )
      SELECT
        b.bucket_start,
        b.bucket_end,
        AVG(EXTRACT(EPOCH FROM (res."endAt" - res."startAt")) / 60.0) AS avg_minutes,
        COUNT(res.id)::int AS count
      FROM buckets b
      LEFT JOIN "Reservation" res
        ON res."startAt" < b.bucket_end
        AND res."endAt" > b.bucket_start
      GROUP BY b.bucket_start, b.bucket_end
      ORDER BY b.bucket_start ASC
    `);
    }
}
