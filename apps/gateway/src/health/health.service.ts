import { Injectable, Logger } from '@nestjs/common';
import { 
  HealthCheckService, 
  HttpHealthIndicator, 
  DiskHealthIndicator, 
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
  HealthIndicatorResult,
  HealthCheckResult
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private serviceStatus: Map<string, boolean> = new Map();

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) {
    // 초기 상태 설정
    this.serviceStatus.set('auth', true);
    this.serviceStatus.set('event', true);
  }

  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.http.pingCheck('gateway', 'http://localhost:3000/api'),
      () => this.getServiceStatus('auth'),
      () => this.getServiceStatus('event'),
    ]);
  }

  async checkDetails(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.http.pingCheck('gateway', 'http://localhost:3000/api'),
      () => this.getServiceStatus('auth'),
      () => this.getServiceStatus('event'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 90 }),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  private getServiceStatus(serviceName: string): Promise<HealthIndicatorResult> {
    const isAvailable = this.serviceStatus.get(serviceName) || false;
    
    return Promise.resolve({
      [serviceName]: {
        status: isAvailable ? 'up' : 'down',
      },
    });
  }

  // CircuitBreaker 패턴 구현
  updateServiceStatus(serviceName: string, isAvailable: boolean): void {
    const currentStatus = this.serviceStatus.get(serviceName);
    
    if (currentStatus !== isAvailable) {
      this.logger.log(`Service ${serviceName} status changed to ${isAvailable ? 'available' : 'unavailable'}`);
      this.serviceStatus.set(serviceName, isAvailable);
    }
  }

  isServiceAvailable(serviceName: string): boolean {
    return this.serviceStatus.get(serviceName) || false;
  }

  async pingService(serviceName: string): Promise<boolean> {
    try {
      let host: string;
      let port: number;

      switch (serviceName) {
        case 'auth':
          host = this.configService.get('AUTH_SERVICE_HOST', 'localhost');
          port = this.configService.get('AUTH_SERVICE_PORT', 3001);
          break;
        case 'event':
          host = this.configService.get('EVENT_SERVICE_HOST', 'localhost');
          port = this.configService.get('EVENT_SERVICE_PORT', 3002);
          break;
        default:
          return false;
      }

      await this.microservice.pingCheck(serviceName, {
        transport: Transport.TCP,
        options: { host, port },
      });
      
      this.updateServiceStatus(serviceName, true);
      return true;
    } catch (error) {
      this.logger.error(`Failed to ping ${serviceName} service: ${error.message}`);
      this.updateServiceStatus(serviceName, false);
      return false;
    }
  }
} 