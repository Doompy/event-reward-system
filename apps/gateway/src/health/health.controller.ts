import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Public()
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  @Public()
  @Get('details')
  @HealthCheck()
  checkDetails(): Promise<HealthCheckResult> {
    return this.healthService.checkDetails();
  }
} 