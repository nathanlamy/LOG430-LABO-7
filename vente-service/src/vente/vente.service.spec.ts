import { Test, TestingModule } from '@nestjs/testing';
import { VenteService } from './vente.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VenteService', () => {
  let service: VenteService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenteService,
        {
          provide: PrismaService,
          useValue: {
            vente: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
              groupBy: jest.fn(),
            },
            ligneVente: {
              deleteMany: jest.fn(),
              groupBy: jest.fn(),
            },
            stock: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            produit: {
              findUnique: jest.fn(),
            },
            magasin: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VenteService>(VenteService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVentes', () => {
    it('should return formatted ventes', async () => {
      prisma.vente.findMany.mockResolvedValue([
        {
          id: 1,
          date: new Date('2025-01-01T00:00:00Z'),
          total: 100,
          magasin: { nom: 'Magasin A' },
          lignes: [
            {
              quantite: 2,
              prixUnitaire: 50,
              produit: { nom: 'Produit A' },
            },
          ],
        },
      ] as any);

      const result = await service.getVentes();

      expect(result).toEqual([
        {
          id: 1,
          date: '2025-01-01T00:00:00.000Z',
          total: 100,
          magasin: 'Magasin A',
          produits: [{ nom: 'Produit A', quantite: 2, prixUnitaire: 50 }],
        },
      ]);
    });
  });

  describe('enregistrerVente', () => {
    it('should throw if produit not found', async () => {
      prisma.produit.findUnique.mockResolvedValue(null);

      await expect(
        service.enregistrerVente({
          magasin_id: 1,
          ligne_ventes: [{ produit_id: 99, quantite: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if stock insuffisant', async () => {
      prisma.produit.findUnique.mockResolvedValue({ id: 1, prix: 10 } as any);
      prisma.stock.findFirst.mockResolvedValue({
        id: 1,
        quantite: 0,
      } as any);

      await expect(
        service.enregistrerVente({
          magasin_id: 1,
          ligne_ventes: [{ produit_id: 1, quantite: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create vente if all is valid', async () => {
      prisma.produit.findUnique.mockResolvedValue({ id: 1, prix: 10, nom: 'Produit A' } as any);
      prisma.stock.findFirst.mockResolvedValue({ id: 1, quantite: 10 } as any);
      prisma.stock.update.mockResolvedValue({} as any);
      prisma.vente.create.mockResolvedValue({ id: 42 } as any);

      const result = await service.enregistrerVente({
        magasin_id: 1,
        ligne_ventes: [{ produit_id: 1, quantite: 2 }],
      });

      expect(result).toEqual({ vente_id: 42 });
    });
  });

  describe('annulerVente', () => {
    it('should throw if vente not found', async () => {
      prisma.vente.findUnique.mockResolvedValue(null);

      await expect(service.annulerVente(42)).rejects.toThrow(NotFoundException);
    });

    it('should restore stock and delete vente', async () => {
      prisma.vente.findUnique.mockResolvedValue({
        id: 42,
        magasinId: 1,
        lignes: [{ produitId: 1, quantite: 2 }],
      } as any);

      prisma.stock.findFirst.mockResolvedValue({ id: 1, quantite: 5 } as any);
      prisma.stock.update.mockResolvedValue({} as any);
      prisma.ligneVente.deleteMany.mockResolvedValue({} as any);
      prisma.vente.delete.mockResolvedValue({} as any);

      const result = await service.annulerVente(42);

      expect(prisma.stock.update).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Vente 42 annulée avec succès' });
    });
  });

  describe('genererRapportConsolide', () => {
    it('should return a valid report', async () => {
      prisma.vente.groupBy.mockResolvedValue([
        { magasinId: 1, _sum: { total: 500 } },
      ]);
      prisma.ligneVente.groupBy.mockResolvedValue([
        { produitId: 1, _sum: { quantite: 10 } },
      ]);
      prisma.magasin.findUnique.mockResolvedValue({ nom: 'Magasin A' });
      prisma.produit.findUnique.mockResolvedValue({ nom: 'Produit X' });

      const result = await service.genererRapportConsolide();

      expect(result).toEqual({
        chiffreAffaires: [{ magasin: 'Magasin A', total: 500 }],
        produitsLesPlusVendus: [{ produit: 'Produit X', quantite: 10 }],
      });
    });
  });
});
