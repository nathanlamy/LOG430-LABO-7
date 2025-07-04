import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VenteService } from './vente.service';
import { CreateVenteDto } from './dto/create-vente.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Ventes')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('ventes')
export class VenteController {
  constructor(private readonly venteService: VenteService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer les ventes',
  })
  @ApiQuery({ name: 'magasinId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste des ventes',
    content: {
      'application/json': {
        example: [
          {
            id: 1,
            date: '2025-06-10T12:00:00Z',
            total: 150.5,
            magasin: 'Magasin A',
            produits: [
              { nom: 'Produit A', quantite: 2, prixUnitaire: 50.0 },
              { nom: 'Produit B', quantite: 1, prixUnitaire: 50.5 },
            ],
          },
        ],
      },
    },
  })
  getVentes(@Query('magasinId') magasinId?: string) {
    return this.venteService.getVentes(magasinId);
  }

  @Get('rapport-consolide')
  @ApiOperation({
    summary:
      'Rapport consolidé (ventes par magasin et produits les plus vendus)',
  })
  @ApiResponse({
    status: 200,
    description: 'Rapport généré avec succès',
    content: {
      'application/json': {
        example: {
          chiffreAffaires: [{ magasin: 'Magasin A', total: 1234.56 }],
          produitsLesPlusVendus: [{ produit: 'Produit X', quantite: 42 }],
        },
      },
    },
  })
  genererRapportConsolide() {
    return this.venteService.genererRapportConsolide();
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Vente enregistrée',
    content: {
      'application/json': {
        example: { vente_id: 42 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuffisant ou données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Produit introuvable',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async enregistrerVente(@Body() dto: CreateVenteDto) {
    return this.venteService.enregistrerVente(dto);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Vente annulée',
    content: {
      'application/json': {
        example: { message: 'Vente 42 annulée avec succès' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Vente introuvable' })
  async annulerVente(@Param('id', ParseIntPipe) id: number) {
    return this.venteService.annulerVente(id);
  }

  @Get('debug-headers')
  getHeaders(@Req() req: Request) {
    console.log('📩 Headers reçus par vente-service:', req.headers);
    return req.headers;
  }
}
