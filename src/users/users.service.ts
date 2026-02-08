import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '../generated/prisma/client';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    findById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    create(data: { email: string; passwordHash: string; firstName: string; lastName: string }): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
            } satisfies Prisma.UserCreateInput
        });
    }
}
