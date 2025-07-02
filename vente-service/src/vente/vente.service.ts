import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVenteDto } from './dto/create-vente.dto';

@Injectable()
export class VenteService {
  constructor(private prisma: PrismaService) {}
  async getVentes(magasinId?: string) {
    const ventes = await this.prisma.vente.findMany({
      where: magasinId ? { magasinId: parseInt(magasinId) } : undefined,
      include: {
        magasin: true,
        lignes: {
          include: {
            produit: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return ventes.map((v) => ({
      id: v.id,
      date: v.date.toISOString(),
      total: v.total,
      magasin: v.magasin?.nom ?? null,
      produits: v.lignes.map((ligne) => ({
        nom: ligne.produit.nom,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
      })),
    }));
  }

  async enregistrerVente(dto: CreateVenteDto) {
    const { magasin_id, ligne_ventes } = dto;

    let total = 0.0;

    const lignes: {
      produitId: number;
      quantite: number;
      prixUnitaire: number;
    }[] = [];

    for (const ligne of ligne_ventes) {
      const produit = await this.prisma.produit.findUnique({
        where: { id: ligne.produit_id },
      });

      if (!produit) {
        throw new NotFoundException(`Produit ${ligne.produit_id} introuvable`);
      }

      total += ligne.quantite * produit.prix;

      lignes.push({
        produitId: produit.id,
        quantite: ligne.quantite,
        prixUnitaire: produit.prix,
      });

      const stock = await this.prisma.stock.findFirst({
        where: {
          produitId: produit.id,
          magasinId: magasin_id,
        },
      });

      if (!stock || stock.quantite < ligne.quantite) {
        throw new BadRequestException(
          `Stock insuffisant pour le produit ${produit.nom}`,
        );
      }

      await this.prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantite: stock.quantite - ligne.quantite,
        },
      });
    }

    const vente = await this.prisma.vente.create({
      data: {
        date: new Date(),
        total: Math.round(total * 100) / 100,
        magasinId: magasin_id,
        lignes: {
          create: lignes,
        },
      },
    });

    return { vente_id: vente.id };
  }

  async annulerVente(venteId: number) {
    const vente = await this.prisma.vente.findUnique({
      where: { id: venteId },
      include: {
        lignes: true,
      },
    });

    if (!vente) {
      throw new NotFoundException(`Vente ${venteId} introuvable`);
    }

    for (const ligne of vente.lignes) {
      const stock = await this.prisma.stock.findFirst({
        where: {
          produitId: ligne.produitId,
          magasinId: vente.magasinId,
        },
      });

      if (stock) {
        await this.prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantite: stock.quantite + ligne.quantite,
          },
        });
      }
    }

    await this.prisma.ligneVente.deleteMany({
      where: {
        venteId: venteId,
      },
    });

    await this.prisma.vente.delete({
      where: { id: venteId },
    });

    return { message: `Vente ${venteId} annulée avec succès` };
  }

  async genererRapportConsolide() {
    const ventesParMagasin = await this.prisma.vente.groupBy({
      by: ['magasinId'],
      _sum: { total: true },
    });

    const produitsLesPlusVendus = await this.prisma.ligneVente.groupBy({
      by: ['produitId'],
      _sum: { quantite: true },
      orderBy: {
        _sum: { quantite: 'desc' },
      },
    });

    const chiffreAffaires = await Promise.all(
      ventesParMagasin.map(async (v) => {
        const magasin = await this.prisma.magasin.findUnique({
          where: { id: v.magasinId },
        });
        return {
          magasin: magasin?.nom ?? `Magasin ${v.magasinId}`,
          total: v._sum.total,
        };
      }),
    );

    const produits = await Promise.all(
      produitsLesPlusVendus.map(async (p) => {
        const produit = await this.prisma.produit.findUnique({
          where: { id: p.produitId },
        });
        return {
          produit: produit?.nom ?? `Produit ${p.produitId}`,
          quantite: p._sum.quantite,
        };
      }),
    );

    return {
      chiffreAffaires,
      produitsLesPlusVendus: produits,
    };
  }
}
