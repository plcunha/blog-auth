import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockDataSource = {
  query: jest.fn().mockResolvedValue([{ '1': 1 }]),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: 'DataSource', useValue: mockDataSource },
      ],
    })
      .overrideProvider(AppService)
      .useFactory({
        factory: () => new AppService(mockDataSource as any),
      })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health check', () => {
    it('should return status ok with timestamp and uptime', () => {
      const result = appController.getHealthCheck();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('detailed health check', () => {
    it('should return status ok with database info when DB is up', async () => {
      const result = await appController.getDetailedHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result.database).toHaveProperty('status', 'up');
      expect(result.database).toHaveProperty('responseTime');
      expect(typeof result.database.responseTime).toBe('number');
    });

    it('should return degraded status when DB is down', async () => {
      mockDataSource.query.mockRejectedValueOnce(
        new Error('Connection refused'),
      );

      const result = await appController.getDetailedHealth();
      expect(result).toHaveProperty('status', 'degraded');
      expect(result.database).toHaveProperty('status', 'down');
      expect(result.database.responseTime).toBeUndefined();
    });
  });
});
