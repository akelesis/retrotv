import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';
import { Program } from '../../programs/entities/program.entity';

@Entity({ name: 'schedule_entries' })
export class ScheduleEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  channel_id: string;

  @ManyToOne(() => Channel, (c: { schedule: any; }) => c.schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column()
  program_id: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ type: 'smallint' })
  day_of_week: number;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
