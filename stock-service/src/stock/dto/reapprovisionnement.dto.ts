import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReapprovisionnementDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  magasinId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  produitId: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantite: number;
}
