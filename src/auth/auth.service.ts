import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.users.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.users.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.signToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email);
  }

  private signToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    return {
      access_token: this.jwt.sign(payload),
    };
  }
}
