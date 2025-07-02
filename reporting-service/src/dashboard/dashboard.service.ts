import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getChiffreAffairesParMagasin() {
    return this.prisma.vente.groupBy({
      by: ['magasinId'],
      _sum: { total: true },
      orderBy: { magasinId: 'asc' },
    });
  }

  async getProduitsEnRupture() {
    const stocks = await this.prisma.stock.findMany({
      include: {
        produit: true,
        magasin: true,
      },
    });

    return stocks.filter((s) => s.quantite < s.seuilCritique);
  }

  async getProduitsEnSurstock() {
    const stocks = await this.prisma.stock.findMany({
      include: {
        produit: true,
        magasin: true,
      },
    });

    return stocks.filter((s) => s.quantite > s.seuilCritique + 100);
  }

  async getTendancesHebdomadaires() {
    return this.prisma.$queryRawUnsafe(`
      SELECT EXTRACT(WEEK FROM "date") AS semaine, SUM(total)::float
      FROM "Vente"
      GROUP BY semaine
      ORDER BY semaine;
    `);
  }

  // Optionnel: méthode globale pour tout rassembler
  async getDashboard() {
    const [chiffreAffaires, rupturesRaw, surstock, tendances] =
      await Promise.all([
        this.getChiffreAffairesParMagasin(),
        this.getProduitsEnRupture(),
        this.getProduitsEnSurstock(),
        this.getTendancesHebdomadaires(),
      ]);

    const ruptures = rupturesRaw.map((r) => ({
      magasin: r.magasin.nom,
      produit: r.produit.nom,
      quantite: r.quantite,
      seuilCritique: r.seuilCritique,
    }));

    return {
      chiffreAffaires,
      ruptures,
      surstock,
      tendances,
    };
  }
}
