import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from '@app/database';
import { MessagePattern } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly databaseService: DatabaseService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @Get('db-test')
  async testDatabaseConnection() {
    const isConnected = await this.databaseService.isConnected();
    return {
      status: isConnected ? 'connected' : 'disconnected',
      message: isConnected ? 'Database connection successful!' : 'Database connection failed!',
    };
  }

  @MessagePattern({ cmd: 'health' })
  checkHealth() {
    return {
      status: 'ok',
      service: 'auth',
      timestamp: new Date().toISOString(),
    };
  }
}
