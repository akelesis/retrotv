import { Controller, Post, Body, Param, Get, Query, Put, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleService } from './schedule.service';
import { CreateScheduleEntryDto } from './dto/create-schedule-entry.dto';
import { UpdateScheduleEntryDto } from './dto/update-schedule-entry.dto';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('channels/:channelId/schedule')
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Post()
  create(@CurrentUserId() userId: string, @Param('channelId') channelId: string, @Body() dto: CreateScheduleEntryDto) {
    return this.service.create(userId, channelId, dto);
  }

  @Get()
  list(@CurrentUserId() userId: string, @Param('channelId') channelId: string, @Query('day') day?: string) {
    const dayNum = day ? parseInt(day, 10) : undefined;
    return this.service.list(userId, channelId, dayNum);
  }

  @Put(':entryId')
  update(@CurrentUserId() userId: string, @Param('channelId') channelId: string, @Param('entryId') entryId: string, @Body() dto: UpdateScheduleEntryDto) {
    return this.service.update(userId, channelId, entryId, dto);
  }

  @Delete(':entryId')
  remove(@CurrentUserId() userId: string, @Param('channelId') channelId: string, @Param('entryId') entryId: string) {
    return this.service.remove(userId, channelId, entryId);
  }

  @Get('/now-playing')
  nowPlaying(@Param('channelId') channelId: string) {
    return this.service.nowPlaying(channelId);
  }
}
