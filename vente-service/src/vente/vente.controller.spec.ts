import { Test, TestingModule } from '@nestjs/testing';
import { VenteController } from './vente.controller';
import { VenteService } from './vente.service';
import { CreateVenteDto } from './dto/create-vente.dto';

describe('VenteController', () => {
  let controller: VenteController;
  let service: jest.Mocked<VenteService>;

  beforeEach(async () => {
    const mockVenteService = {
      getVentes: jest.fn(),
      genererRapportConsolide: jest.fn(),
      enregistrerVente: jest.fn(),
      annulerVente: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenteController],
      providers: [
        {
          provide: VenteService,
          useValue: mockVenteService,
        },
      ],
    }).compile();

    controller = module.get<VenteController>(VenteController);
    service = module.get(VenteService) as jest.Mocked<VenteService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVentes', () => {
    it('should return an array of ventes', async () => {
      const mockResult = [{ id: 1, total: 150 }];
      service.getVentes.mockResolvedValueOnce(mockResult as any);
      const result = await controller.getVentes();
      expect(result).toEqual(mockResult);
      expect(service.getVentes).toHaveBeenCalledWith(undefined);
    });

    it('should return ventes filtered by magasinId', async () => {
      service.getVentes.mockResolvedValueOnce([{ id: 2 }] as any);
      const result = await controller.getVentes('5');
      expect(service.getVentes).toHaveBeenCalledWith('5');
      expect(result).toEqual([{ id: 2 }]);
    });
  });

  describe('genererRapportConsolide', () => {
    it('should return a consolidated report', async () => {
      const mockReport = {
        chiffreAffaires: [{ magasin: 'A', total: 1000 }],
        produitsLesPlusVendus: [{ produit: 'X', quantite: 10 }],
      };
      service.genererRapportConsolide.mockResolvedValueOnce(mockReport as any);
      const result = await controller.genererRapportConsolide();
      expect(result).toEqual(mockReport);
    });
  });

  describe('enregistrerVente', () => {
    it('should register a vente', async () => {
      const dto: CreateVenteDto = {
        date: new Date().toISOString(),
        magasinId: 1,
        produits: [{ produitId: 1, quantite: 2 }],
      };
      const mockResponse = { vente_id: 42 };
      service.enregistrerVente.mockResolvedValueOnce(mockResponse as any);
      const result = await controller.enregistrerVente(dto);
      expect(service.enregistrerVente).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('annulerVente', () => {
    it('should cancel a vente', async () => {
      service.annulerVente.mockResolvedValueOnce({ message: 'OK' } as any);
      const result = await controller.annulerVente(42);
      expect(service.annulerVente).toHaveBeenCalledWith(42);
      expect(result).toEqual({ message: 'OK' });
    });
  });
});
