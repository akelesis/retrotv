import { Controller, Post, Body, Get, Param, Put, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class ChannelsController {
  constructor(private readonly service: ChannelsService) {}

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateChannelDto) {
    console.log('Creating channel for user', userId, 'with data', dto);
    return this.service.create(userId, dto);
  }

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.service.findAll(userId);
  }

  @Get(':id')
  async findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
    const c = await this.service.findOne(userId, id);
    if (!c) throw new NotFoundException();
    return c;
  }

  @Put(':id')
  update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
