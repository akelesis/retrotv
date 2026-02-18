import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ScheduleEntry } from '../../schedule/entities/schedule-entry.entity';

@Entity({ name: 'channels' })
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  abbr?: string;

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({ name: 'text_color', length: 50, nullable: true })
  textColor?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 500, nullable: true })
  logo_url?: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (u) => u.channels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ScheduleEntry, (s) => s.channel)
  schedule: ScheduleEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
