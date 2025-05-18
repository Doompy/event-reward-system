import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'libs/database/schema/user.schema';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  @Get('details')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @HealthCheck()
  checkDetails(): Promise<HealthCheckResult> {
    return this.healthService.checkDetails();
  }
} 