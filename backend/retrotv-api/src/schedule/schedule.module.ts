import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEntry } from './entities/schedule-entry.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Program } from '../programs/entities/program.entity';
import { Channel } from '../channels/entities/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEntry, Program, Channel])],
  providers: [ScheduleService],
  controllers: [ScheduleController],
})
export class ScheduleModule {}
