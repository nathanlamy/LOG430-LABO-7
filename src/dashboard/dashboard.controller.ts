import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@ApiTags('Dashboard')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Tableau de bord consolidé' })
  @ApiResponse({
    status: 200,
    description: 'Retourne toutes les statistiques du tableau de bord',
    content: {
      'application/json': {
        example: {
          chiffreAffaires: [{ magasinId: 1, _sum: { total: 1234.56 } }],
          ruptures: [
            {
              magasin: 'Magasin A',
              produit: 'Clavier',
              quantite: 3,
              seuilCritique: 5,
            },
          ],
          surstock: [
            {
              magasin: 'Magasin B',
              produit: 'Souris',
              quantite: 250,
              seuilCritique: 100,
            },
          ],
          tendances: [{ semaine: 23, sum: 300.75 }],
        },
      },
    },
  })
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
