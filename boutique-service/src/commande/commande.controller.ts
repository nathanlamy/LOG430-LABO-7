import {
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandeService } from './commande.service';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Commande')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('commande')
export class CommandeController {
  constructor(private readonly commandeService: CommandeService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Commande passée avec succès' })
  passerCommande() {
    return this.commandeService.passerCommande();
  }
}
