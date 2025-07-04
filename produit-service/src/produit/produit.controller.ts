import {
  Controller,
  Get,
  Query,
  Patch,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProduitService } from './produit.service';
import { ApiTags, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProduitDto } from './dto/produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Produits')
//@ApiBearerAuth('jwt')
//@UseGuards(JwtAuthGuard)
@Controller('produits')
export class ProduitController {
  constructor(private readonly produitService: ProduitService) {}

  @Get()
  @ApiQuery({ name: 'id', required: false, type: Number })
  @ApiQuery({ name: 'nom', required: false, type: String })
  @ApiQuery({ name: 'categorie', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits filtrés ou complets',
    type: ProduitDto,
    isArray: true,
  })
  async findProduits(
    @Query('id') id?: string,
    @Query('nom') nom?: string,
    @Query('categorie') categorie?: string,
  ) {
    return this.produitService.chercherProduits({
      id: id ? parseInt(id) : undefined,
      nom,
      categorie,
    });
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Produit mis à jour',
    type: ProduitDto,
    content: {
      'application/json': {
        example: {
          id: 1,
          nom: 'Pommes bio',
          categorie: 'Fruits',
          prix: 1.49,
          description: 'Pomme rouge juteuse',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: ['prix must not be less than 0'],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Produit non trouvé',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: "Produit avec l'id 99 introuvable",
          error: 'Not Found',
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateProduit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProduitDto,
  ) {
    return this.produitService.updateProduit(id, dto);
  }
}
