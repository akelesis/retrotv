import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUrl, IsBoolean, ValidateIf } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  abbr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  textColor?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateIf((o) => !!o.logo_url)
  @IsUrl()
  logo_url?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
