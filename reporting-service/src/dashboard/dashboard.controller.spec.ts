import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getDashboard: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService) as jest.Mocked<DashboardService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      const mockData = {
        chiffreAffaires: [{ magasinId: 1, _sum: { total: 1234.56 } }],
        ruptures: [
          {
            magasin: 'Magasin A',
            produit: 'Clavier',
            quantite: 3,
            seuilCritique: 5,
          },
        ],
        surstock: [
          {
            magasin: 'Magasin B',
            produit: 'Souris',
            quantite: 250,
            seuilCritique: 100,
          },
        ],
        tendances: [{ semaine: 23, sum: 300.75 }],
      };

      service.getDashboard.mockResolvedValueOnce(mockData);

      const result = await controller.getDashboard();

      expect(service.getDashboard).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });
});
