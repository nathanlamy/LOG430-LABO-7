import { Module } from '@nestjs/common';
import { ProduitModule } from './produit/produit.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { PrismaModule } from 'prisma/prisma.module';
import { VenteModule } from './vente/vente.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProduitModule,
    StockModule,
    VenteModule,
    DashboardModule,
    PrometheusModule.register(),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore(),
        host: 'redis',
        port: 6379,
        ttl: 30,
      }),
    }),
  ],
  providers: [PrismaService],
})
export class AppModule {}
