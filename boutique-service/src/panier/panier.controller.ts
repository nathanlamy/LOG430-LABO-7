import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PanierService } from './panier.service';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AjouterPanierDto } from './dto/ajouter-panier.dto';

@ApiTags('Panier')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('panier')
export class PanierController {
  constructor(private readonly panierService: PanierService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Produit ajouté au panier' })
  ajouter(@Body() dto: AjouterPanierDto) {
    return this.panierService.ajouterAuPanier(dto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Contenu du panier' })
  afficher() {
    return this.panierService.getPanier();
  }
}
