import { Module } from '@nestjs/common';
import { CommandeService } from './commande.service';
import { CommandeController } from './commande.controller';

@Module({
  providers: [CommandeService],
  controllers: [CommandeController]
})
export class CommandeModule {}
