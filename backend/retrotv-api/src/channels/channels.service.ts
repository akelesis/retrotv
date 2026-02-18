import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private repo: Repository<Channel>,
  ) {}

  async create(userId: string, dto: CreateChannelDto) {
    const c = this.repo.create({ ...dto, user_id: userId });
    return this.repo.save(c);
  }

  async findAll(userId: string) {
    return this.repo.find({ where: { user_id: userId } });
  }

  async findOne(userId: string, id: string) {
    return this.repo.findOne({ where: { id, user_id: userId } });
  }

  async update(userId: string, id: string, dto: UpdateChannelDto) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) return null;
    if (c.user_id !== userId) throw new ForbiddenException();
    Object.assign(c, dto);
    return this.repo.save(c);
  }

  async remove(userId: string, id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) return { affected: 0 };
    if (c.user_id !== userId) throw new ForbiddenException();
    return this.repo.delete(id);
  }
}
