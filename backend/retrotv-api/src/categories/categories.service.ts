import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    const c = this.repo.create(dto);
    return this.repo.save(c);
  }

  async findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) return null;
    Object.assign(c, dto);
    return this.repo.save(c);
  }

  async remove(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) return null;
    await this.repo.delete(id);
    return c;
  }
}
