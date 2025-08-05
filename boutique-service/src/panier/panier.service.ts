import { Injectable } from '@nestjs/common';
import { AjouterPanierDto } from './dto/ajouter-panier.dto';

@Injectable()
export class PanierService {
  private panier: AjouterPanierDto[] = [];

  ajouterAuPanier(item: AjouterPanierDto) {
    this.panier.push(item);
    return { message: 'Ajouté au panier', item };
  }

  getPanier() {
    return this.panier;
  }

  viderPanier() {
    this.panier = [];
  }
}
