import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ProduitModule } from './produit/produit.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CacheModule } from '@nestjs/cache-manager';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';


@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProduitModule,
    MetricsModule,
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
