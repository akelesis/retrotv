import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private repo: Repository<Program>,
  ) {}

  async create(dto: CreateProgramDto) {
    const p = this.repo.create(dto);
    return this.repo.save(p);
  }

  async findAll(source_type?: string, category_id?: string) {
    const qb = this.repo.createQueryBuilder('p');
    if (source_type) qb.andWhere('p.source_type = :source', { source: source_type });
    if (category_id) qb.andWhere('p.category_id = :category_id', { category_id });
    return qb.getMany();
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['category'] });
  }

  async update(id: string, dto: UpdateProgramDto) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) return null;
    Object.assign(p, dto);
    return this.repo.save(p);
  }

  async remove(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) return null;
    await this.repo.delete(id);
    return p;
  }
}
