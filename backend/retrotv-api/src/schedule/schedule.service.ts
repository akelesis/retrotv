import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { ScheduleEntry } from './entities/schedule-entry.entity';
import { CreateScheduleEntryDto } from './dto/create-schedule-entry.dto';
import { UpdateScheduleEntryDto } from './dto/update-schedule-entry.dto';
import { Channel } from '../channels/entities/channel.entity';
import { Program } from '../programs/entities/program.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleEntry)
    private repo: Repository<ScheduleEntry>,

    @InjectRepository(Channel)
    private channelRepo: Repository<Channel>,

    @InjectRepository(Program)
    private programRepo: Repository<Program>,

    private storage: StorageService,
  ) {}

  private timeToSQL(t: string) {
    // expects HH:MM
    return t + ':00';
  }

  async create(userId: string, channelId: string, dto: CreateScheduleEntryDto) {
    const channel = await this.channelRepo.findOne({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('channel');
    if (channel.user_id !== userId) throw new ForbiddenException();

    const program = await this.programRepo.findOne({ where: { id: dto.program_id } });
    if (!program) throw new NotFoundException('program');

    // overlap check
    const overlaps = await this.repo.createQueryBuilder('s')
      .where('s.channel_id = :channelId', { channelId })
      .andWhere('s.day_of_week = :day', { day: dto.day_of_week })
      .andWhere('s.start_time < :end_time AND s.end_time > :start_time', { start_time: this.timeToSQL(dto.start_time), end_time: this.timeToSQL(dto.end_time) })
      .getCount();

    if (overlaps > 0) throw new ConflictException('Schedule overlap');

    const entry = this.repo.create({ ...dto, channel_id: channelId });
    return this.repo.save(entry);
  }

  async list(userId: string, channelId: string, day?: number) {
    const channel = await this.channelRepo.findOne({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('channel');
    if (channel.user_id !== userId) throw new ForbiddenException();

    const qb = this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'p')
      .where('s.channel_id = :channelId', { channelId });
    if (typeof day === 'number') qb.andWhere('s.day_of_week = :day', { day });
    qb.orderBy('s.start_time', 'ASC');
    return qb.getMany();
  }

  async update(userId: string, channelId: string, entryId: string, dto: UpdateScheduleEntryDto) {
    const channel = await this.channelRepo.findOne({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('channel');
    if (channel.user_id !== userId) throw new ForbiddenException();

    const entry = await this.repo.findOne({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('entry');

    const start = dto.start_time ?? entry.start_time.slice(0,5);
    const end = dto.end_time ?? entry.end_time.slice(0,5);
    const day = dto.day_of_week ?? entry.day_of_week;

    const overlaps = await this.repo.createQueryBuilder('s')
      .where('s.channel_id = :channelId', { channelId })
      .andWhere('s.day_of_week = :day', { day })
      .andWhere('s.id != :id', { id: entryId })
      .andWhere('s.start_time < :end_time AND s.end_time > :start_time', { start_time: this.timeToSQL(start), end_time: this.timeToSQL(end) })
      .getCount();

    if (overlaps > 0) throw new ConflictException('Schedule overlap');

    Object.assign(entry, dto);
    return this.repo.save(entry);
  }

  async remove(userId: string, channelId: string, entryId: string) {
    const channel = await this.channelRepo.findOne({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('channel');
    if (channel.user_id !== userId) throw new ForbiddenException();

    return this.repo.delete({ id: entryId, channel_id: channelId } as any);
  }

  async nowPlaying(channelId: string) {
    const now = new Date();
    const day = now.getDay(); // 0-6
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hh}:${mm}:${ss}`;

    const entry = await this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'p')
      .where('s.channel_id = :channelId', { channelId })
      .andWhere('s.day_of_week = :day', { day })
      .andWhere('s.start_time <= :time AND s.end_time > :time', { time: currentTime })
      .getOne();

    if (!entry) return null;

    // Parse start_time (HH:MM:SS) to calculate elapsed time
    const [startH, startM, startS] = entry.start_time.split(':').map(Number);
    const startTotalSeconds = startH * 3600 + startM * 60 + (startS || 0);
    const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const elapsedSeconds = currentTotalSeconds - startTotalSeconds;

    // Parse end_time to get total program duration in the schedule
    const [endH, endM, endS] = entry.end_time.split(':').map(Number);
    const endTotalSeconds = endH * 3600 + endM * 60 + (endS || 0);
    const scheduleDurationSeconds = endTotalSeconds - startTotalSeconds;

    // Para programas do catálogo, gera presigned URL do S3/Wasabi
    let sourceUrl = entry.program?.source_url;
    if (entry.program?.source_type === 'catalog' && sourceUrl) {
      sourceUrl = await this.storage.getPresignedUrl(sourceUrl);
    }

    return {
      program: { ...entry.program, source_url: sourceUrl },
      schedule: entry,
      playback: {
        program_start_time: entry.start_time,
        current_time: currentTime,
        elapsed_seconds: elapsedSeconds,
        elapsed_minutes: Math.floor(elapsedSeconds / 60),
        remaining_seconds: scheduleDurationSeconds - elapsedSeconds,
        remaining_minutes: Math.floor((scheduleDurationSeconds - elapsedSeconds) / 60),
        progress_percent: Math.round((elapsedSeconds / scheduleDurationSeconds) * 100),
        seek_to_seconds: elapsedSeconds,
      },
    };
  }
}
