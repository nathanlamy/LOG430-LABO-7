import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total') private counter: Counter,
    @InjectMetric('http_request_duration_seconds') private histogram: Histogram,
  ) {}

  trackRequest(method: string, route: string, status_code: number, duration: number) {
    this.counter.inc({ method, route, status_code });
    this.histogram.observe({ method, route, status_code }, duration);
  }
}
