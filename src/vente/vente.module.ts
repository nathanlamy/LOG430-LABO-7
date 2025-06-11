import { Module } from '@nestjs/common';
import { VenteController } from './vente.controller';
import { VenteService } from './vente.service';

@Module({
  controllers: [VenteController],
  providers: [VenteService]
})
export class VenteModule {}
