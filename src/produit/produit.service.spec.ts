import { Test, TestingModule } from '@nestjs/testing';
import { ProduitService } from './produit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProduitService', () => {
  let service: ProduitService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockPrisma = {
    produit: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProduitService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProduitService>(ProduitService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return all products if no filter is given', async () => {
    const expected = [{ id: 1, nom: 'Pommes', categorie: 'Fruits' }];
    mockPrisma.produit.findMany.mockResolvedValue(expected);

    const result = await service.chercherProduits({});
    expect(result).toEqual(expected);
    expect(mockPrisma.produit.findMany).toHaveBeenCalledWith();
  });

  it('should filter by id', async () => {
    const expected = [{ id: 1, nom: 'Pommes', categorie: 'Fruits' }];
    mockPrisma.produit.findMany.mockResolvedValue(expected);

    const result = await service.chercherProduits({ id: 1 });
    expect(result).toEqual(expected);
    expect(mockPrisma.produit.findMany).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('should filter by nom (case insensitive)', async () => {
    const expected = [{ id: 2, nom: 'Savon', categorie: 'Hygiène' }];
    mockPrisma.produit.findMany.mockResolvedValue(expected);

    const result = await service.chercherProduits({ nom: 'sav' });
    expect(result).toEqual(expected);
    expect(mockPrisma.produit.findMany).toHaveBeenCalledWith({
      where: {
        nom: {
          contains: 'sav',
          mode: 'insensitive',
        },
      },
    });
  });

  it('should filter by categorie (case insensitive)', async () => {
    const expected = [{ id: 3, nom: 'Lait', categorie: 'Épicerie' }];
    mockPrisma.produit.findMany.mockResolvedValue(expected);

    const result = await service.chercherProduits({ categorie: 'épice' });
    expect(result).toEqual(expected);
    expect(mockPrisma.produit.findMany).toHaveBeenCalledWith({
      where: {
        categorie: {
          contains: 'épice',
          mode: 'insensitive',
        },
      },
    });
  });
});
