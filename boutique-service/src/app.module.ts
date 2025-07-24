import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PanierModule } from './panier/panier.module';
import { CommandeModule } from './commande/commande.module';
import { HttpModule } from '@nestjs/axios';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CacheModule } from '@nestjs/cache-manager';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PanierModule,
    CommandeModule,
    MetricsModule,
    HttpModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
