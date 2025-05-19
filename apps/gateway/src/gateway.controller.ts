import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('헬스 체크')
@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: '인증 서비스 상태 확인', description: '인증 서비스의 상태를 확인합니다.' })
  @ApiResponse({ status: 200, description: '서비스 상태 정보' })
  @ApiResponse({ status: 500, description: '서비스 연결 실패' })
  @Public()
  @Get('auth/health')
  async checkAuthHealth() {
    return firstValueFrom(this.authClient.send({ cmd: 'health' }, {}));
  }

  @ApiOperation({ summary: '이벤트 서비스 상태 확인', description: '이벤트 서비스의 상태를 확인합니다.' })
  @ApiResponse({ status: 200, description: '서비스 상태 정보' })
  @ApiResponse({ status: 500, description: '서비스 연결 실패' })
  @Public()
  @Get('event/health')
  async checkEventHealth() {
    return firstValueFrom(this.eventClient.send({ cmd: 'health' }, {}));
  }
}
