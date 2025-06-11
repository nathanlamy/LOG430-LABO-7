import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ProduitService {
  constructor(private prisma: PrismaService) {}

  async chercherProduits(params: {
    id?: number;
    nom?: string;
    categorie?: string;
  }) {
    const { id, nom, categorie } = params;

    if (id) {
      return this.prisma.produit.findMany({
        where: { id },
      });
    }

    if (nom) {
      return this.prisma.produit.findMany({
        where: {
          nom: {
            contains: nom,
            mode: 'insensitive',
          },
        },
      });
    }

    if (categorie) {
      return this.prisma.produit.findMany({
        where: {
          categorie: {
            contains: categorie,
            mode: 'insensitive',
          },
        },
      });
    }

    return this.prisma.produit.findMany();
  }

  async updateProduit(id: number, data: UpdateProduitDto) {
    const produit = await this.prisma.produit.findUnique({ where: { id } });

    if (!produit) {
      throw new NotFoundException(`Produit avec l'id ${id} introuvable`);
    }

    return this.prisma.produit.update({
      where: { id },
      data,
    });
  }
}
