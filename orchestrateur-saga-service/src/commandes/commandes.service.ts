// commandes.service.ts
import axios from 'axios';
import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommandeDto } from './dto/create-command.dto';
import { MetricsService } from '../metrics/metrics.service';
import { EventBusService } from 'src/event-bus.service';
import { createClient } from 'redis';
import { randomUUID } from 'crypto';

const BASE = 'http://vente-service:3000'; // KrakenD
const produitsAPI = `http://produit-service:3000/produits`;
const ventesAPI   = `http://vente-service:3000/ventes`;
const stockAPI    = `http://stock-service:3000/stock`;
const REDIS_STREAM = 'commande-events';

const redisClient = createClient({ url: 'redis://redis:6379' });
redisClient.connect();

enum EtatCommande {
  INITIEE = 'INITIEE',
  STOCK_OK = 'STOCK_OK',
  VENTE_CREEE = 'VENTE_CREEE',
  CONFIRMEE = 'CONFIRMEE',
  ANNULEE = 'ANNULEE'
}

let bearerToken = '';

async function getBearerToken() {
  if (bearerToken) return bearerToken;
  const res = await axios.post(`${BASE}/auth/login`, {
    username: 'admin',
    password: 'admin',
  });
  bearerToken = `Bearer ${res.data.access_token}`;
  return bearerToken;
}

async function authorizedGet(url: string, timeout = 2000) {
  const token = await getBearerToken();
  return axios.get(url, { headers: { Authorization: token }, timeout });
}

async function authorizedPost(url: string, data: any, timeout = 2000) {
  const token = await getBearerToken();
  return axios.post(url, data, { headers: { Authorization: token }, timeout });
}

async function authorizedDelete(url: string, timeout = 2000) {
  const token = await getBearerToken();
  return axios.delete(url, { headers: { Authorization: token }, timeout });
}

@Injectable()
export class CommandesService {
  constructor(
    private prisma: PrismaService,
    private metrics: MetricsService,
    private eventBus: EventBusService
  ) {}

  async getCommande(id: string) {
    return this.prisma.commande.findUnique({
      where: { id },
      include: { items: true, events: true }
    });
  }

  private async emitEvent(eventType: string, data: any) {
    const timestamp = Date.now();
    await redisClient.xAdd(REDIS_STREAM, '*', {
      id: randomUUID(),
      type: eventType,
      emitted_at: timestamp.toString(),
      payload: JSON.stringify(data),
    });
    this.metrics.eventEmitted(eventType);
    this.metrics.recordEventLatency(eventType, REDIS_STREAM, timestamp);
    this.metrics.countEvent(eventType, REDIS_STREAM);
  }

  private async log(commandeId: string, step: string, outcome: string, details?: any) {
    await this.prisma.sagaEvent.create({
      data: { commandeId, step, outcome, details: details ? JSON.stringify(details) : undefined }
    });
  }

  async orchestrerCommande(dto: CreateCommandeDto) {
    const stop = this.metrics.startSagaTimer();

    try {
      const commande = await this.prisma.commande.create({
        data: {
          magasinId: dto.magasinId,
          etat: EtatCommande.INITIEE,
          items: { create: dto.items.map(i => ({ produitId: i.produitId, quantite: i.quantite })) }
        },
        include: { items: true }
      });
      await this.log(commande.id, 'INIT', 'OK');
      await this.emitEvent('commande.initiee', { commandeId: commande.id });

      const stock = await this.metrics.measureExternal('stock', 'check', () =>
        authorizedGet(`${stockAPI}/${dto.magasinId}`)
      ).then(r => r.data);

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
      await this.emitEvent('commande.stock_ok', { commandeId: commande.id });

      const produits = await this.metrics.measureExternal('produits', 'list', () =>
        authorizedGet(produitsAPI)
      ).then(r => r.data);

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

      if (dto.simulate?.venteFail) {
        this.metrics.step('VENTE_CREATE', 'ko');
        await this.fail(commande.id, 'VENTE_CREATE', 'KO', { simulate: 'venteFail' });
        throw new HttpException(
          { commandeId: commande.id, etat: 'ANNULEE', raison: 'VENTE_ERREUR' },
          422
        );
      }

      const vente = await this.metrics.measureExternal('ventes', 'create', () =>
        authorizedPost(ventesAPI, {
          magasin_id: dto.magasinId,
          ligne_ventes: lignes.map(l => ({ produit_id: l.produitId, quantite: l.quantite }))
        }, 3000)
      ).then(r => r.data);

      await this.prisma.commande.update({
        where: { id: commande.id },
        data: { etat: EtatCommande.VENTE_CREEE, venteId: vente.id }
      });
      this.metrics.step('VENTE_CREATE', 'ok');
      await this.log(commande.id, 'VENTE_CREATE', 'OK', { venteId: vente.id });
      await this.emitEvent('commande.vente_creee', { commandeId: commande.id, venteId: vente.id });

      if (dto.simulate?.failAfterVenteCreated) {
        await this.compenseVente(commande.id, vente.id, lignes);
        this.metrics.endSagaFail(stop);
        throw new HttpException(
          { commandeId: commande.id, etat: 'ANNULEE', raison: 'ECHEC_APRES_VENTE' },
          422
        );
      }

      await this.prisma.commande.update({
        where: { id: commande.id },
        data: { etat: EtatCommande.CONFIRMEE }
      });
      await this.log(commande.id, 'SAGA_END', 'OK');
      await this.emitEvent('commande.confirmee', { commandeId: commande.id });

      this.metrics.endSagaSuccess(stop);
      return { commandeId: commande.id, etat: 'CONFIRMEE', venteId: vente.id, total };

    } catch (e) {
      this.metrics.endSagaFail(stop);
      throw e;
    }
  }

  private findInsuffisances(stockList: any[], items: {produitId:number; quantite:number;}[]) {
    const insuff: any[] = [];
    for (const it of items) {
      const st = stockList.find(s => s.produit_id === it.produitId);
      if (!st || st.quantite < it.quantite) {
        insuff.push({ produitId: it.produitId, manque: (it.quantite - (st?.quantite ?? 0)) });
      }
    }
    return insuff;
  }

  private async compenseVente(commandeId: string, venteId: number, lignes: {produitId:number; quantite:number;}[]) {
    try {
      await this.metrics.measureExternal('ventes', 'delete', () =>
        authorizedDelete(`${ventesAPI}/${venteId}`)
      );
      this.metrics.step('COMP_DELETE_VENTE', 'ok');
      await this.log(commandeId, 'COMP_DELETE_VENTE', 'OK', { venteId });
    } catch (e) {
      this.metrics.step('COMP_DELETE_VENTE', 'ko');
      await this.log(commandeId, 'COMP_DELETE_VENTE', 'KO', { venteId, error: String(e) });
    }

    try {
      for (const l of lignes) {
        await this.metrics.measureExternal('stock', 'reappro', async () =>
          authorizedPost(`${stockAPI}/reapprovisionnement`, {
            magasinId: Number((await this.prisma.commande.findUnique({ where: { id: commandeId } }))!.magasinId),
            produitId: l.produitId,
            quantite: l.quantite
          })
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
    await this.emitEvent('commande.annulee', { commandeId });
  }

  private async updateEtat(id: string, etat: EtatCommande, step: string) {
    await this.prisma.commande.update({ where: { id }, data: { etat } });
    await this.log(id, step, 'OK', { etat });
  }

  private async fail(id: string, step: string, outcome: 'KO', details?: any) {
    await this.prisma.commande.update({ where: { id }, data: { etat: EtatCommande.ANNULEE } });
    await this.log(id, step, outcome, details);
    await this.emitEvent('commande.annulee', { commandeId: id });
  }
}
