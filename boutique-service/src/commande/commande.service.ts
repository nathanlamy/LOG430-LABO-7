import { Injectable } from '@nestjs/common';
import { PanierService } from '../panier/panier.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommandeService {
  constructor(
    private readonly httpService: HttpService,
    private readonly panierService: PanierService,
  ) {}

  async passerCommande() {
    const panier = this.panierService.getPanier();

    for (const item of panier) {
      const res = await firstValueFrom(
        this.httpService.get(
          `${process.env.STOCK_SERVICE_URL}/stock/${item.produitId}`,
        ),
      );

      if (!res?.data || res.data.quantite < item.quantite) {
        throw new Error(
          `Stock insuffisant ou produit introuvable : ${item.produitId}`,
        );
      }
    }

    const response = await firstValueFrom(
      this.httpService.post(`${process.env.VENTE_SERVICE_URL}/vente`, {
        items: panier,
      }),
    );

    this.panierService.viderPanier();

    return {
      message: 'Commande passée',
      commande: response.data,
    };
  }
}
