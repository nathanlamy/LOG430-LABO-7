import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StockResponseDto } from './dto/stock-response.dto';
import { ReapprovisionnementDto } from './dto/reapprovisionnement.dto';

@ApiTags('Stock')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Get('central')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulter le stock central' })
  @ApiResponse({
    status: 200,
    description: 'Liste du stock central',
    content: {
      'application/json': {
        example: [
          {
            produitId: 1,
            nom: 'Clavier Logitech',
            quantite: 120,
            seuilCritique: 30,
          },
        ],
      },
    },
  })
  async consulterStockCentral() {
    return this.stockService.consulterStockCentral();
  }

  @Post('reapprovisionnement')
  @ApiOperation({
    summary: 'Réapprovisionner un magasin depuis le stock central',
  })
  @ApiResponse({ status: 201, description: 'Réapprovisionnement effectué' })
  @ApiResponse({ status: 400, description: 'Stock insuffisant ou invalide' })
  async reapprovisionner(@Body() dto: ReapprovisionnementDto) {
    return this.stockService.reapprovisionner(dto);
  }

  @Get(':magasinId')
  @ApiParam({ name: 'magasinId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits en stock dans un magasin',
    type: StockResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Aucun stock trouvé',
  })
  async getStock(@Param('magasinId', ParseIntPipe) magasinId: number) {
    return this.stockService.getStockParMagasin(magasinId);
  }
}
