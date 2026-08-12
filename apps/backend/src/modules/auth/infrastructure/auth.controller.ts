import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Request } from 'express';
import { LoginResult } from '../application/queries/login.handler';
import { LoginQuery } from '../application/queries/login.query';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly queryBus: QueryBus) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.queryBus.execute<LoginQuery, LoginResult>(
      new LoginQuery(dto.email, dto.password),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request): JwtPayload {
    return req.user as JwtPayload;
  }
}
