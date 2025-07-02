import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class LigneVenteDto {
  @ApiProperty()
  @IsInt()
  produit_id: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantite: number;
}

export class CreateVenteDto {
  @ApiProperty()
  @IsInt()
  magasin_id: number;

  @ApiProperty({ type: [LigneVenteDto] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LigneVenteDto)
  ligne_ventes: LigneVenteDto[];
}
