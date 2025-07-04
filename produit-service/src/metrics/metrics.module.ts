import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsProviders } from './metrics.providers';

@Module({
  providers: [MetricsService, ...MetricsProviders],
  exports: [MetricsService],
})
export class MetricsModule {}
