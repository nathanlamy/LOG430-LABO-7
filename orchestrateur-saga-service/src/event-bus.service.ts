// event-bus.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class EventBusService implements OnModuleInit {
  private client: ReturnType<typeof createClient>;

  async onModuleInit() {
    this.client = createClient(); // localhost:6379 par défaut
    await this.client.connect();
  }

  async publish(stream: string, event: Record<string, any>) {
    const enriched = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...event,
    };
    await this.client.xAdd(stream, '*', enriched);
  }
}
