// commandes.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-command.dto';

@Controller('commandes')
export class CommandesController {
  constructor(private readonly svc: CommandesService) {}

  @Post()
  create(@Body() dto: CreateCommandeDto) {
    return this.svc.orchestrerCommande(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.getCommande(id);
  }
}
