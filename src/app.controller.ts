import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Quick health check (no DB query)' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-02-07T12:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
      },
    },
  })
  @Get('health')
  getHealthCheck() {
    return this.appService.getHealthCheck();
  }

  @ApiOperation({
    summary: 'Detailed health check with database connectivity',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status including database',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-02-07T12:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'up' },
            responseTime: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @Get('health/details')
  getDetailedHealth() {
    return this.appService.getDetailedHealth();
  }
}
