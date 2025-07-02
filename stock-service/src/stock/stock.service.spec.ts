import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StockService', () => {
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: {
            stock: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            stockCentral: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn((cb) =>
              cb({
                stock: {
                  findFirst: jest.fn(),
                  update: jest.fn(),
                  create: jest.fn(),
                },
                stockCentral: {
                  update: jest.fn(),
                },
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
