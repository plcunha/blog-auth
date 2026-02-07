import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  getHealthCheck(): {
    status: string;
    timestamp: string;
    uptime: number;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  async getDetailedHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    database: { status: string; responseTime?: number };
  }> {
    const dbHealth = await this.checkDatabase();

    const overallStatus = dbHealth.status === 'up' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: dbHealth,
    };
  }

  private async checkDatabase(): Promise<{
    status: string;
    responseTime?: number;
  }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', responseTime: Date.now() - start };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return { status: 'down' };
    }
  }
}
