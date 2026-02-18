import { Controller, Post, Body, Get, Query, Param, Put, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProgramsService } from './programs.service';
import { YoutubeService } from './youtube.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateFromYoutubeDto } from './dto/create-from-youtube.dto';
import { SourceType } from './enums/source-type.enum';

@UseGuards(AuthGuard('jwt'))
@Controller('programs')
export class ProgramsController {
  constructor(
    private readonly service: ProgramsService,
    private readonly youtube: YoutubeService,
  ) {}

  @Post()
  create(@Body() dto: CreateProgramDto) {
    return this.service.create(dto);
  }

  @Post('youtube')
  async createFromYoutube(@Body() dto: CreateFromYoutubeDto) {
    const metadata = await this.youtube.getVideoMetadata(dto.url);
    return this.service.create({
      ...metadata,
      source_type: SourceType.YOUTUBE,
      category_id: dto.category_id,
    });
  }

  @Get()
  findAll(
    @Query('source_type') source_type?: string,
    @Query('category_id') category_id?: string,
  ) {
    return this.service.findAll(source_type, category_id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const p = await this.service.findOne(id);
    if (!p) throw new NotFoundException();
    return p;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    const p = await this.service.update(id, dto);
    if (!p) throw new NotFoundException();
    return p;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const p = await this.service.remove(id);
    if (!p) throw new NotFoundException();
    return p;
  }
}
