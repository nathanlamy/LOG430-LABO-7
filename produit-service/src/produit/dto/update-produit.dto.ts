import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProduitDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional()
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional()
  categorie?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  prix?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;
}
