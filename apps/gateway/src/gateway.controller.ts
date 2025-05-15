import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @Get('auth/health')
  async checkAuthHealth() {
    return firstValueFrom(this.authClient.send({ cmd: 'health' }, {}));
  }

  @Get('event/health')
  async checkEventHealth() {
    return firstValueFrom(this.eventClient.send({ cmd: 'health' }, {}));
  }
}
