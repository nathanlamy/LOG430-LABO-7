import { Test, TestingModule } from '@nestjs/testing';
import { VenteService } from './vente.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VenteService', () => {
  let service: VenteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenteService,
        {
          provide: PrismaService,
          useValue: {
            vente: {
              create: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
            ligneVente: {
              createMany: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            stock: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            magasin: {
              findUnique: jest.fn(),
            },
            produit: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VenteService>(VenteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
