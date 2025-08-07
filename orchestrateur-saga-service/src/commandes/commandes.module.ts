import { Module } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CommandesController } from './commandes.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { EventBusService } from 'src/event-bus.service';

@Module({
  imports: [MetricsModule],
  providers: [CommandesService, EventBusService],
  controllers: [CommandesController]
})
export class CommandesModule {}
