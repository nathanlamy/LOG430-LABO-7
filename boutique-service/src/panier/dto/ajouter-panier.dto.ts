import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AjouterPanierDto {
  @ApiProperty()
  @IsString()
  produitId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantite: number;
}
