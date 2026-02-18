import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const u = await this.service.findOneById(id);
    if (!u) throw new NotFoundException();
    return u;
  }
}
