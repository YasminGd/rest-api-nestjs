import { ConfigService } from '@nestjs/config/dist';
import { Prisma } from '@prisma/client';
import { AuthDto } from './dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    const { password, email } = dto;
    //generate the password hash
    const hash = await argon.hash(password);
    //save the new user in the database
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          hash,
        },
      });
      return this.signToken(user.id, user.email);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw err;
    }
  }

  async signin(dto: AuthDto) {
    const { password, email } = dto;
    //find the user
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    //if the user does not exist throw exception
    if (!user) throw new ForbiddenException('Credentials incorrect');

    //compare the passwords
    const pwMatches = await argon.verify(user.hash, password);
    //if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    //send back the user
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email };

    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token,
    };
  }
}
