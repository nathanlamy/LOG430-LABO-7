import { ApiProperty } from '@nestjs/swagger';

export class ProduitDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  categorie: string;

  @ApiProperty()
  prix: number;

  @ApiProperty({ required: false })
  description?: string;
}
