import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Program } from './entities/program.entity';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { YoutubeService } from './youtube.service';

@Module({
  imports: [TypeOrmModule.forFeature([Program]), HttpModule],
  controllers: [ProgramsController],
  providers: [ProgramsService, YoutubeService],
})
export class ProgramsModule {}
