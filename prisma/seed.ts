import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    await prisma.reservation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.room.deleteMany();

    const rooms = await prisma.room.createMany({
        data: [
            { name: 'Room A', maxCapacity: 6 },
            { name: 'Room B', maxCapacity: 10 },
            { name: 'Room C', maxCapacity: 20 },
            { name: 'Room D', maxCapacity: 4 },
        ],
    });

    const roomList = await prisma.room.findMany();

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

    const addHours = (date: Date, hours: number) =>
        new Date(date.getTime() + hours * 60 * 60 * 1000);

    await prisma.reservation.createMany({
        data: [
            {
                roomId: roomList[0].id,
                userId: user1.id,
                startAt: addHours(now, 1),
                endAt: addHours(now, 2),
            },
            {
                roomId: roomList[0].id,
                userId: user2.id,
                startAt: addHours(now, 3),
                endAt: addHours(now, 4),
            },
            {
                roomId: roomList[1].id,
                userId: user1.id,
                startAt: addHours(now, 2),
                endAt: addHours(now, 5),
            },
            {
                roomId: roomList[2].id,
                userId: user2.id,
                startAt: addHours(now, 6),
                endAt: addHours(now, 8),
            },
        ],

    });

    console.log('Seed completed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
