import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReapprovisionnementDto } from './dto/reapprovisionnement.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getStockParMagasin(magasinId: number) {
    const stocks = await this.prisma.stock.findMany({
      where: { magasinId },
      include: {
        produit: true,
      },
    });

    if (!stocks.length) {
      throw new NotFoundException(
        `Aucun stock trouvé pour le magasin ${magasinId}`,
      );
    }

    return stocks.map((stock) => ({
      produit_id: stock.produitId,
      nom: stock.produit.nom,
      quantite: stock.quantite,
      seuil_critique: stock.seuilCritique,
    }));
  }

  async consulterStockCentral() {
    const stocks = await this.prisma.stockCentral.findMany({
      include: {
        produit: true,
      },
    });

    return stocks.map((stock) => ({
      produitId: stock.produitId,
      nom: stock.produit.nom,
      quantite: stock.quantite,
      seuilCritique: stock.seuilCritique,
    }));
  }

  async reapprovisionner(dto: ReapprovisionnementDto) {
    const { magasinId, produitId, quantite } = dto;

    const stockCentral = await this.prisma.stockCentral.findFirst({
      where: { produitId },
    });

    if (!stockCentral || stockCentral.quantite < quantite) {
      throw new BadRequestException('Stock central insuffisant');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.stockCentral.updateMany({
        where: { produitId },
        data: {
          quantite: { decrement: quantite },
        },
      });

      const existingStock = await tx.stock.findFirst({
        where: { magasinId, produitId },
      });

      if (existingStock) {
        await tx.stock.update({
          where: { id: existingStock.id },
          data: { quantite: { increment: quantite } },
        });
      } else {
        await tx.stock.create({
          data: {
            magasinId,
            produitId,
            quantite,
            seuilCritique: 10,
          },
        });
      }
    });

    return { message: 'Réapprovisionnement effectué avec succès' };
  }
}
