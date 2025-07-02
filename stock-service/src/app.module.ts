import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CacheModule } from '@nestjs/cache-manager';


@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StockModule,
    PrometheusModule.register(),
    CacheModule.registerAsync({
      useFactory: async () => {
        const redisStore = (await import('cache-manager-redis-store')).default;
        return {
          store: redisStore,
          host: 'redis',
          port: 6379,
          ttl: 30,
        };
      },
    }),
  ],
  providers: [PrismaService],
})
export class AppModule {}
