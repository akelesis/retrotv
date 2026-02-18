import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Channel])],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [TypeOrmModule],
})
export class ChannelsModule {}
