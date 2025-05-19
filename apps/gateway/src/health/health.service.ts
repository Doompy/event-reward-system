import { Injectable, Inject, Logger } from '@nestjs/common';
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
import { Transport, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private serviceStatus: { [key: string]: boolean } = {
    auth: false,
    event: false
  };

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy
  ) {
    // 서비스 상태 초기화
    this.checkServicesHealth();
  }

  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.http.pingCheck('gateway', 'http://gateway:3000/api'),
      () => this.getServiceStatus('auth'),
      () => this.getServiceStatus('event'),
    ]);
  }

  async checkDetails(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.http.pingCheck('gateway', 'http://gateway:3000/api'),
      () => this.getServiceStatus('auth'),
      () => this.getServiceStatus('event'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 90 }),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  private getServiceStatus(serviceName: string): Promise<HealthIndicatorResult> {
    const isAvailable = this.serviceStatus[serviceName] || false;
    
    return Promise.resolve({
      [serviceName]: {
        status: isAvailable ? 'up' : 'down',
      },
    });
  }

  async checkServicesHealth(): Promise<void> {
    this.logger.log('Checking services health...');
    
    try {
      const authHealth = await firstValueFrom(
        this.authClient.send({ cmd: 'health' }, {})
          .pipe(
            timeout(3000),
            catchError(err => {
              this.logger.error(`Auth service health check failed: ${err.message}`);
              this.serviceStatus.auth = false;
              return Promise.resolve({ status: 'error' });
            })
          )
      );
      
      this.serviceStatus.auth = authHealth.status === 'ok';
      this.logger.log(`Auth service health: ${this.serviceStatus.auth ? 'UP' : 'DOWN'}`);
    } catch (error) {
      this.logger.error(`Error checking Auth service health: ${error.message}`);
      this.serviceStatus.auth = false;
    }

    try {
      const eventHealth = await firstValueFrom(
        this.eventClient.send({ cmd: 'health' }, {})
          .pipe(
            timeout(3000),
            catchError(err => {
              this.logger.error(`Event service health check failed: ${err.message}`);
              this.serviceStatus.event = false;
              return Promise.resolve({ status: 'error' });
            })
          )
      );
      
      this.serviceStatus.event = eventHealth.status === 'ok';
      this.logger.log(`Event service health: ${this.serviceStatus.event ? 'UP' : 'DOWN'}`);
    } catch (error) {
      this.logger.error(`Error checking Event service health: ${error.message}`);
      this.serviceStatus.event = false;
    }
  }

  getServicesStatus(): { [key: string]: boolean } {
    return this.serviceStatus;
  }

  updateServiceStatus(service: string, status: boolean): void {
    if (service in this.serviceStatus) {
      const oldStatus = this.serviceStatus[service];
      this.serviceStatus[service] = status;
      
      if (oldStatus !== status) {
        this.logger.log(`Service ${service} status changed: ${oldStatus ? 'UP' : 'DOWN'} -> ${status ? 'UP' : 'DOWN'}`);
      }
    }
  }

  isServiceAvailable(serviceName: string): boolean {
    return this.serviceStatus[serviceName] || false;
  }

  async pingService(serviceName: string): Promise<boolean> {
    try {
      await this.health.check([
        async () => this.microservice.pingCheck(
          serviceName, 
          {
            transport: Transport.TCP,
            options: {
              host: serviceName,
              port: serviceName === 'auth' ? 3001 : 3002,
            },
          },
        ),
      ]);
      this.updateServiceStatus(serviceName, true);
      return true;
    } catch (error) {
      this.logger.error(`Failed to ping ${serviceName} service: ${error.message}`);
      this.updateServiceStatus(serviceName, false);
      return false;
    }
  }
}