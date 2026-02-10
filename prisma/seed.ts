import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.reservation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.room.deleteMany();

  await prisma.room.createMany({
    data: [
      { name: 'Room A', maxCapacity: 6 },
      { name: 'Room B', maxCapacity: 10 },
      { name: 'Room C', maxCapacity: 20 },
      { name: 'Room D', maxCapacity: 4 },
    ],
  });

  const roomList = await prisma.room.findMany({ orderBy: { id: 'asc' } });

  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@test.com',
      firstName: 'Alice',
      lastName: 'Martin',
      passwordHash,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@test.com',
      firstName: 'Bob',
      lastName: 'Durand',
      passwordHash,
    },
  });

  const now = new Date();

  const addMinutes = (date: Date, minutes: number) =>
    new Date(date.getTime() + minutes * 60 * 1000);

  const addHours = (date: Date, hours: number) => addMinutes(date, hours * 60);

  const addDays = (date: Date, days: number) => addHours(date, days * 24);

  const slot = (baseDate: Date, startHourOffset: number, durationHours: number) => {
    const startAt = addHours(baseDate, startHourOffset);
    const endAt = addHours(baseDate, startHourOffset + durationHours);
    return { startAt, endAt };
  };

  const d0 = now;
  const d1 = addDays(now, 1);
  const d2 = addDays(now, 2);
  const d14 = addDays(now, 14);

  const [roomA, roomB, roomC, roomD] = roomList;

  const reservationsData = [
    // ----------------
    // Today (d0)
    // ----------------
    { roomId: roomA.id, userId: user1.id, ...slot(d0, 1, 1) },  // +1h -> +2h
    { roomId: roomA.id, userId: user2.id, ...slot(d0, 3, 1) },  // +3h -> +4h
    { roomId: roomA.id, userId: user1.id, ...slot(d0, 5, 2) },  // +5h -> +7h

    { roomId: roomB.id, userId: user2.id, ...slot(d0, 2, 3) },  // +2h -> +5h
    { roomId: roomB.id, userId: user1.id, ...slot(d0, 6, 1) },  // +6h -> +7h

    { roomId: roomC.id, userId: user2.id, ...slot(d0, 6, 2) },  // +6h -> +8h
    { roomId: roomC.id, userId: user1.id, ...slot(d0, 9, 1) },  // +9h -> +10h

    { roomId: roomD.id, userId: user1.id, ...slot(d0, 4, 1) },  // +4h -> +5h
    { roomId: roomD.id, userId: user2.id, ...slot(d0, 6, 1) },  // +6h -> +7h

    // ----------------
    // +1 day (d1)
    // ----------------
    { roomId: roomA.id, userId: user2.id, ...slot(d1, 10, 2) }, // 10:00 -> 12:00
    { roomId: roomA.id, userId: user1.id, ...slot(d1, 13, 1) }, // 13:00 -> 14:00

    { roomId: roomB.id, userId: user1.id, ...slot(d1, 9, 1) },  // 09:00 -> 10:00
    { roomId: roomB.id, userId: user2.id, ...slot(d1, 11, 2) }, // 11:00 -> 13:00

    { roomId: roomC.id, userId: user1.id, ...slot(d1, 14, 2) }, // 14:00 -> 16:00
    { roomId: roomD.id, userId: user2.id, ...slot(d1, 8, 1) },  // 08:00 -> 09:00

    // ----------------
    // +2 days (d2)
    // ----------------
    { roomId: roomA.id, userId: user1.id, ...slot(d2, 9, 1) },  // 09:00 -> 10:00
    { roomId: roomA.id, userId: user2.id, ...slot(d2, 11, 1) }, // 11:00 -> 12:00
    { roomId: roomA.id, userId: user1.id, ...slot(d2, 15, 2) }, // 15:00 -> 17:00

    { roomId: roomB.id, userId: user2.id, ...slot(d2, 10, 1) }, // 10:00 -> 11:00
    { roomId: roomB.id, userId: user1.id, ...slot(d2, 12, 3) }, // 12:00 -> 15:00

    { roomId: roomC.id, userId: user2.id, ...slot(d2, 9, 2) },  // 09:00 -> 11:00
    { roomId: roomD.id, userId: user1.id, ...slot(d2, 16, 1) }, // 16:00 -> 17:00

    // ----------------
    // +2 weeks (d14)
    // ----------------
    { roomId: roomA.id, userId: user2.id, ...slot(d14, 9, 1) },  // 09:00 -> 10:00
    { roomId: roomA.id, userId: user1.id, ...slot(d14, 11, 2) }, // 11:00 -> 13:00

    { roomId: roomB.id, userId: user1.id, ...slot(d14, 14, 1) }, // 14:00 -> 15:00
    { roomId: roomB.id, userId: user2.id, ...slot(d14, 16, 2) }, // 16:00 -> 18:00

    { roomId: roomC.id, userId: user2.id, ...slot(d14, 10, 3) }, // 10:00 -> 13:00
    { roomId: roomD.id, userId: user1.id, ...slot(d14, 8, 1) },  // 08:00 -> 09:00
  ];

  await prisma.reservation.createMany({
    data: reservationsData,
  });

  console.log(`Seed completed: ${roomList.length} rooms, 2 users, ${reservationsData.length} reservations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
