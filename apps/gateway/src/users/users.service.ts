import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from 'apps/auth/src/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { firstValueFrom } from 'rxjs';
import { HealthService } from '../health/health.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly healthService: HealthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Auth 서비스에 TCP로 메시지 전송
    try {
      return await firstValueFrom(
        this.authClient.send('create_user', createUserDto)
      );
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      this.healthService.updateServiceStatus('auth', false);
      throw error;
    }
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    try {
      const response = await firstValueFrom(
        this.authClient.send('login', { loginDto, ipAddress, userAgent })
      );

      if (!response.success) {
        throw new UnauthorizedException(response.message || 'Invalid credentials');
      }

      // 서비스 가용성 업데이트
      this.healthService.updateServiceStatus('auth', true);

      return {
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
    } catch (error) {
      this.logger.error(`Error during login: ${error.message}`);
      this.healthService.updateServiceStatus('auth', false);
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto, ipAddress?: string, userAgent?: string) {
    try {
      const response = await firstValueFrom(
        this.authClient.send('refresh_token', { 
          refreshToken: refreshTokenDto.refreshToken,
          ipAddress,
          userAgent
        })
      );

      if (!response.success) {
        throw new UnauthorizedException(response.message || 'Invalid refresh token');
      }

      return {
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
    } catch (error) {
      this.logger.error(`Error refreshing token: ${error.message}`);
      this.healthService.updateServiceStatus('auth', false);
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  async logout(token: string, userId: string) {
    try {
      return await firstValueFrom(
        this.authClient.send('revoke_token', { token, userId })
      );
    } catch (error) {
      this.logger.error(`Error logging out: ${error.message}`);
      return { success: false, message: 'Logout failed' };
    }
  }

  async validateToken(token: string) {
    try {
      this.logger.log(`🔐 Validating token with Auth service`);
      this.logger.log(`Token starts with: ${token.substring(0, 15)}...`);
      
      this.logger.log(`Sending message pattern: 'validate_token'`);
      
      // TCP 연결 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Token validation timed out')), 5000);
      });
      
      const responsePromise = firstValueFrom(
        this.authClient.send('validate_token', { token })
      );
      
      // 두 Promise 중 먼저 완료되는 것을 기다림
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      this.logger.log(`Auth service response: ${JSON.stringify(response)}`);

      if (!response.isValid) {
        this.logger.warn(`Token validation failed: ${JSON.stringify(response)}`);
        throw new UnauthorizedException('Invalid token');
      }

      // 서비스 가용성 업데이트
      this.healthService.updateServiceStatus('auth', true);
      
      // Auth 서비스에서 반환한 사용자 정보 그대로 반환
      if (response.user) {
        return response.user;
      } else {
        this.logger.warn('Auth service did not return user data');
        throw new UnauthorizedException('User data not found');
      }
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      this.healthService.updateServiceStatus('auth', false);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async updateUserRole(updateRoleDto: UpdateUserRoleDto, adminId: string) {
    try {
      return await firstValueFrom(
        this.authClient.send('update_user_role', { 
          updateData: updateRoleDto, 
          adminId 
        })
      );
    } catch (error) {
      this.logger.error(`Error updating user role: ${error.message}`);
      this.healthService.updateServiceStatus('auth', false);
      throw error;
    }
  }

  async findAllUsers() {
    try {
      return await firstValueFrom(
        this.authClient.send('find_all_users', {})
      );
    } catch (error) {
      this.logger.error(`Error finding all users: ${error.message}`);
      this.healthService.updateServiceStatus('auth', false);
      throw error;
    }
  }

  async getUserRole(email: string) {
    try {
      return await firstValueFrom(
        this.authClient.send('get_user_role', email)
      );
    } catch (error) {
      this.logger.error(`Error getting user role: ${error.message}`);
      this.healthService.updateServiceStatus('auth', false);
      throw error;
    }
  }
}