import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { SourceType } from '../enums/source-type.enum';

@Entity({ name: 'programs' })
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 500, nullable: true })
  thumbnail_url?: string;

  @Column({ type: 'enum', enum: SourceType })
  source_type: SourceType;

  @Column({ length: 500 })
  source_url: string;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ nullable: true })
  category_id?: string;

  @ManyToOne(() => Category, (c) => c.programs, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
