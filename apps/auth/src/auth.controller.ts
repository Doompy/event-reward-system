import { Controller, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload, Ctx, RmqContext, TcpContext } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RefreshTokenDto } from './dto/token.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'health' })
  @ApiOperation({ summary: '서버 상태 확인' })
  @ApiResponse({ status: 200, description: '서버가 정상 동작 중' })
  async checkHealth(@Ctx() context: TcpContext) {
    this.logger.log('Health check requested');
    this.logger.log(`Client: ${context.getPattern()}`);
    return { status: 'ok', service: 'auth' };
  }

  @MessagePattern('create_user')
  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: 201, description: '사용자가 성공적으로 생성됨' })
  async create(@Payload() createUserDto: CreateUserDto): Promise<any> {
    try {
      const user = await this.authService.create(createUserDto);
      // 비밀번호 제외하고 반환
      const { password, ...result } = user.toObject();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @MessagePattern('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  async login(@Payload() data: { loginDto: LoginDto, ipAddress?: string, userAgent?: string }) {
    return this.authService.login(data.loginDto, data.ipAddress, data.userAgent);
  }

  @MessagePattern('validate_token')
  @ApiOperation({ summary: '토큰 검증' })
  @ApiResponse({ status: 200, description: '토큰이 유효함' })
  async validateToken(@Payload() data: { token: string }, @Ctx() context: TcpContext) {
    this.logger.log(`📨 Received validate_token message`);
    this.logger.log(`Client pattern: ${context.getPattern()}`);
    this.logger.log(`Token starts with: ${data.token.substring(0, 10)}...`);
    
    try {
      const result = await this.authService.validateToken(data.token);
      if (result.isValid) {
        this.logger.log('✅ Token validation successful');
      } else {
        this.logger.warn(`❌ Token validation failed: ${result.message}`);
      }
      return result;
    } catch (error) {
      this.logger.error(`❌ Token validation error: ${error.message}`);
      return { isValid: false, message: error.message };
    }
  }

  @MessagePattern('refresh_token')
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  async refreshToken(@Payload() data: { refreshToken: string, ipAddress?: string, userAgent?: string }) {
    return this.authService.refreshToken(data.refreshToken, data.ipAddress, data.userAgent);
  }

  @MessagePattern('revoke_token')
  @ApiOperation({ summary: '토큰 폐기' })
  @ApiResponse({ status: 200, description: '토큰 폐기 성공' })
  async revokeToken(@Payload() data: { token: string, userId: string }) {
    return this.authService.revokeToken(data.token, data.userId);
  }

  @MessagePattern('update_user_role')
  @ApiOperation({ summary: '사용자 역할 수정' })
  @ApiResponse({ status: 200, description: '사용자 역할 수정 성공' })
  async updateUserRole(@Payload() data: { updateData: UpdateUserRoleDto, adminId: string }) {
    return this.authService.updateUserRole(data.updateData, data.adminId);
  }

  @MessagePattern('find_all_users')
  @ApiOperation({ summary: '모든 사용자 조회' })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  async findAllUsers() {
    return this.authService.findAllUsers();
  }

  @MessagePattern('get_user_role')
  @ApiOperation({ summary: '사용자 역할 조회' })
  @ApiResponse({ status: 200, description: '사용자 역할 조회 성공' })
  async getUserRole(@Payload() email: string) {
    return this.authService.getUserRole(email);
  }
}
