import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
