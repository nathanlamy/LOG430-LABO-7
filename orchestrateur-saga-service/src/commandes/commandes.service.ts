// commandes.service.ts
import axios from 'axios';
import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommandeDto } from './dto/create-command.dto';
import { MetricsService } from '../../metrics/metrics.service';

const BASE = 'http://{IP_VM}:8080'; // KrakenD
const produitsAPI = `${BASE}/produits`;
const ventesAPI   = `${BASE}/ventes`;
const stockAPI    = `${BASE}/stock`;

enum EtatCommande {
  INITIEE = 'INITIEE',
  STOCK_OK = 'STOCK_OK',
  VENTE_CREEE = 'VENTE_CREEE',
  CONFIRMEE = 'CONFIRMEE',
  ANNULEE = 'ANNULEE'
}

@Injectable()
export class CommandesService {
  constructor(
    private prisma: PrismaService,
    private metrics: MetricsService,
  ) {}

  async getCommande(id: string) {
    return this.prisma.commande.findUnique({
      where: { id },
      include: { items: true, events: true }
    });
  }

  private async log(commandeId: string, step: string, outcome: string, details?: any) {
    await this.prisma.sagaEvent.create({
      data: { commandeId, step, outcome, details: details ? JSON.stringify(details) : undefined }
    });
  }

  async orchestrerCommande(dto: CreateCommandeDto) {
    // Chronométrage global de la saga
    const stop = this.metrics.startSagaTimer();

    try {
      // 1) Créer commande INITIEE
      const commande = await this.prisma.commande.create({
        data: {
          magasinId: dto.magasinId,
          etat: EtatCommande.INITIEE,
          items: { create: dto.items.map(i => ({ produitId: i.produitId, quantite: i.quantite })) }
        },
        include: { items: true }
      });
      await this.log(commande.id, 'INIT', 'OK');

      // 2) Vérifier stock magasin
      const stock = await this.metrics
        .measureExternal('stock', 'check', () =>
          axios.get(`${stockAPI}/${dto.magasinId}`, { timeout: 2000 })
        )
        .then(r => r.data);

      const insuff = this.findInsuffisances(stock, dto.items);
      if (dto.simulate?.stockInsufficient) insuff.push({ produitId: -1, manque: 999 });

      if (insuff.length > 0) {
        this.metrics.step('STOCK_CHECK', 'ko');
        await this.fail(commande.id, 'STOCK_CHECK', 'KO', { insuff });
        throw new HttpException(
          { commandeId: commande.id, etat: 'ANNULEE', raison: 'STOCK_INSUFFISANT' },
          409
        );
      }
      this.metrics.step('STOCK_CHECK', 'ok');
      await this.updateEtat(commande.id, EtatCommande.STOCK_OK, 'STOCK_CHECK');

      // 3) Enrichir prix depuis produits + calcul total
      const produits = await this.metrics
        .measureExternal('produits', 'list', () =>
          axios.get(produitsAPI, { timeout: 2000 })
        )
        .then(r => r.data);

      const lignes = commande.items.map(it => {
        const p = produits.find((x: any) => x.id === it.produitId);
        if (!p) throw new Error(`Produit ${it.produitId} introuvable`);
        return { produitId: it.produitId, quantite: it.quantite, prixUnitaire: p.prix };
      });

      const total = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

      await this.prisma.commande.update({
        where: { id: commande.id },
        data: {
          total,
          items: {
            updateMany: lignes.map(l => ({
              where: { id: commande.items.find(ci => ci.produitId === l.produitId)!.id },
              data: { prixUnitaire: l.prixUnitaire }
            }))
          }
        }
      });

      // 4) Créer vente (POST /ventes)
      if (dto.simulate?.venteFail) {
        this.metrics.step('VENTE_CREATE', 'ko');
        await this.fail(commande.id, 'VENTE_CREATE', 'KO', { simulate: 'venteFail' });
        throw new HttpException(
          { commandeId: commande.id, etat: 'ANNULEE', raison: 'VENTE_ERREUR' },
          422
        );
      }

      const vente = await this.metrics
        .measureExternal('ventes', 'create', () =>
          axios.post(ventesAPI, {
            magasinId: dto.magasinId,
            total,
            lignes: lignes.map(l => ({
              produitId: l.produitId,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire
            }))
          }, { timeout: 3000 })
        )
        .then(r => r.data);

      await this.prisma.commande.update({
        where: { id: commande.id },
        data: { etat: EtatCommande.VENTE_CREEE, venteId: vente.id }
      });
      this.metrics.step('VENTE_CREATE', 'ok');
      await this.log(commande.id, 'VENTE_CREATE', 'OK', { venteId: vente.id });

      // 5) (Simulation d’échec après vente créée) → compensation
      if (dto.simulate?.failAfterVenteCreated) {
        await this.compenseVente(commande.id, vente.id, lignes);
        this.metrics.endSagaFail(stop);
        throw new HttpException(
          { commandeId: commande.id, etat: 'ANNULEE', raison: 'ECHEC_APRES_VENTE' },
          422
        );
      }

      // 6) Succès
      await this.prisma.commande.update({
        where: { id: commande.id },
        data: { etat: EtatCommande.CONFIRMEE }
      });
      await this.log(commande.id, 'SAGA_END', 'OK');

      this.metrics.endSagaSuccess(stop);
      return { commandeId: commande.id, etat: 'CONFIRMEE', venteId: vente.id, total };

    } catch (e) {
      // Finir proprement la métrique en cas d’erreur
      this.metrics.endSagaFail(stop);
      throw e;
    }
  }

  // === helpers HTTP ===
  private findInsuffisances(
    stockList: any[],
    items: {produitId:number; quantite:number;}[]
  ) {
    const insuff: any[] = [];
    for (const it of items) {
      const st = stockList.find(s => s.produitId === it.produitId);
      if (!st || st.quantite < it.quantite) {
        insuff.push({
          produitId: it.produitId,
          manque: (it.quantite - (st?.quantite ?? 0))
        });
      }
    }
    return insuff;
  }

  // === compensation ===
  private async compenseVente(
    commandeId: string,
    venteId: number,
    lignes: {produitId:number; quantite:number;}[]
  ) {
    // 1) Supprimer la vente
    try {
      await this.metrics.measureExternal('ventes', 'delete', () =>
        axios.delete(`${ventesAPI}/${venteId}`, { timeout: 2000 })
      );
      this.metrics.step('COMP_DELETE_VENTE', 'ok');
      await this.log(commandeId, 'COMP_DELETE_VENTE', 'OK', { venteId });
    } catch (e) {
      this.metrics.step('COMP_DELETE_VENTE', 'ko');
      await this.log(commandeId, 'COMP_DELETE_VENTE', 'KO', { venteId, error: String(e) });
    }

    // 2) (Optionnel) réapprovisionner si ton DELETE ne restaure pas le stock
    try {
      for (const l of lignes) {
        await this.metrics.measureExternal('stock', 'reappro', async () =>
          axios.post(`${stockAPI}/reapprovisionnement`, {
            magasinId: Number(
              (await this.prisma.commande.findUnique({ where: { id: commandeId } }))!.magasinId
            ),
            produitId: l.produitId,
            quantite: l.quantite
          }, { timeout: 2000 })
        );
      }
      this.metrics.step('COMP_REAPPRO', 'ok');
      await this.log(commandeId, 'COMP_REAPPRO', 'OK');
    } catch (e) {
      this.metrics.step('COMP_REAPPRO', 'ko');
      await this.log(commandeId, 'COMP_REAPPRO', 'KO', String(e));
    }

    await this.prisma.commande.update({
      where: { id: commandeId },
      data: { etat: EtatCommande.ANNULEE }
    });
    await this.log(commandeId, 'SAGA_END', 'KO', { reason: 'compensation' });
  }

  private async updateEtat(id: string, etat: EtatCommande, step: string) {
    await this.prisma.commande.update({ where: { id }, data: { etat } });
    await this.log(id, step, 'OK', { etat });
  }

  private async fail(id: string, step: string, outcome: 'KO', details?: any) {
    await this.prisma.commande.update({ where: { id }, data: { etat: EtatCommande.ANNULEE } });
    await this.log(id, step, outcome, details);
  }
}
