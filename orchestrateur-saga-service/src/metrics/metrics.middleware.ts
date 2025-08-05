import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ModuleRef } from '@nestjs/core';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private metricsService: MetricsService;

  constructor(private moduleRef: ModuleRef) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.metricsService) {
      this.metricsService = this.moduleRef.get(MetricsService, { strict: false });
    }

    const startHrTime = process.hrtime();

    res.on('finish', () => {
      const diff = process.hrtime(startHrTime);
      const duration = diff[0] + diff[1] / 1e9;

      this.metricsService.trackRequest(
        req.method,
        req.route?.path || req.originalUrl,
        res.statusCode,
        duration,
      );
    });

    next();
  }
}
