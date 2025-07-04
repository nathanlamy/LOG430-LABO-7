import { Test, TestingModule } from '@nestjs/testing';
import { VenteController } from './vente.controller';
import { VenteService } from './vente.service';
import { CreateVenteDto } from './dto/create-vente.dto';

describe('VenteController', () => {
  let controller: VenteController;
  let service: jest.Mocked<VenteService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenteController],
      providers: [
        {
          provide: VenteService,
          useValue: {
            getVentes: jest.fn(),
            genererRapportConsolide: jest.fn(),
            enregistrerVente: jest.fn(),
            annulerVente: jest.fn(),
          },
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
    it('should return ventes', async () => {
      const mockResult = [{ id: 1 }];
      service.getVentes.mockResolvedValueOnce(mockResult as any);
      const result = await controller.getVentes();
      expect(result).toEqual(mockResult);
    });
  });

  describe('genererRapportConsolide', () => {
    it('should return report', async () => {
      const report = { chiffreAffaires: [], produitsLesPlusVendus: [] };
      service.genererRapportConsolide.mockResolvedValue(report);
      const result = await controller.genererRapportConsolide();
      expect(result).toEqual(report);
    });
  });

  describe('enregistrerVente', () => {
    it('should register vente', async () => {
      const dto: CreateVenteDto = {
        magasin_id: 1,
        ligne_ventes: [{ produit_id: 1, quantite: 2 }],
      };
      service.enregistrerVente.mockResolvedValue({ vente_id: 42 });
      const result = await controller.enregistrerVente(dto);
      expect(result).toEqual({ vente_id: 42 });
    });
  });

  describe('annulerVente', () => {
    it('should cancel vente', async () => {
      service.annulerVente.mockResolvedValue({ message: 'ok' });
      const result = await controller.annulerVente(42);
      expect(result).toEqual({ message: 'ok' });
    });
  });
});
