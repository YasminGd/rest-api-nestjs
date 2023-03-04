import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { Request } from 'express';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
//   @UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
//   getMe(@GetUser('email') email: string) {
//     return email;
//   }
}
