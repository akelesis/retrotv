import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateFromYoutubeDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;
}
