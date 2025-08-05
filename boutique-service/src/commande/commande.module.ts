import { Module } from '@nestjs/common';
import { CommandeService } from './commande.service';
import { CommandeController } from './commande.controller';
import { HttpModule } from '@nestjs/axios/dist/http.module';
import { PanierModule } from '../panier/panier.module';

@Module({
  imports: [PanierModule, HttpModule],
  providers: [CommandeService],
  controllers: [CommandeController]
})
export class CommandeModule {}
