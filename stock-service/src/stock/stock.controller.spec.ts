import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { ReapprovisionnementDto } from './dto/reapprovisionnement.dto';

describe('StockController', () => {
  let controller: StockController;
  let service: jest.Mocked<StockService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: {
            getStockParMagasin: jest.fn(),
            consulterStockCentral: jest.fn(),
            reapprovisionner: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    service = module.get(StockService) as jest.Mocked<StockService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStock', () => {
    it('should return stock for a given magasin', async () => {
      const mockStock = [
        { produitId: 1, nom: 'Produit A', quantite: 5, seuilCritique: 2 },
      ];
      service.getStockParMagasin.mockResolvedValueOnce(mockStock);

      const result = await controller.getStock(1);

      expect(service.getStockParMagasin).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStock);
    });
  });

  describe('consulterStockCentral', () => {
    it('should return stock central list', async () => {
      const mockStockCentral = [
        { produitId: 1, nom: 'Produit B', quantite: 100, seuilCritique: 10 },
      ];
      service.consulterStockCentral.mockResolvedValueOnce(mockStockCentral);

      const result = await controller.consulterStockCentral();

      expect(service.consulterStockCentral).toHaveBeenCalled();
      expect(result).toEqual(mockStockCentral);
    });
  });

  describe('reapprovisionner', () => {
    it('should call reapprovisionner with correct dto', async () => {
      const dto: ReapprovisionnementDto = {
        magasinId: 1,
        produits: [{ produitId: 2, quantite: 10 }],
      };
      const mockResponse = { message: 'Réapprovisionnement effectué' };

      service.reapprovisionner.mockResolvedValueOnce(mockResponse);

      const result = await controller.reapprovisionner(dto);

      expect(service.reapprovisionner).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });
});
