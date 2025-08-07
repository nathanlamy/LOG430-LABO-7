// event-bus.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
import { MetricsService } from './metrics/metrics.service';

@Injectable()
export class EventBusService implements OnModuleInit {
  private client: ReturnType<typeof createClient>;

  constructor(private metrics: MetricsService) {}
  async onModuleInit() {
    this.client = createClient({ url: 'redis://redis:6379' });
    await this.client.connect();
  }

  async publish(stream: string, event: Record<string, any>) {
    const enriched = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...event,
    };
    await this.client.xAdd(stream, '*', enriched);
    this.metrics.countEvent(event.type || 'Unknown', stream);
  }
}
