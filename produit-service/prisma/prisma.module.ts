import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 👈 rend accessible partout sans devoir importer dans chaque module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
