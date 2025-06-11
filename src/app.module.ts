import { Module } from '@nestjs/common';
import { ProduitModule } from './produit/produit.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { PrismaModule } from 'prisma/prisma.module';
import { VenteModule } from './vente/vente.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProduitModule,
    StockModule,
    VenteModule,
    DashboardModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
