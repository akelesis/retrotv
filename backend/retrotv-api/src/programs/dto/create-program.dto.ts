import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl, IsInt, IsUUID, Min, MaxLength } from 'class-validator';
import { SourceType } from '../enums/source-type.enum';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;

  @IsEnum(SourceType)
  source_type: SourceType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  source_url: string;

  @IsInt()
  @Min(1)
  duration_minutes: number;

  @IsOptional()
  @IsUUID()
  category_id?: string;
}
