import { ApiProperty } from '@nestjs/swagger';

export class StockResponseDto {
  @ApiProperty()
  produit_id: number;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  quantite: number;

  @ApiProperty()
  seuil_critique: number;
}
