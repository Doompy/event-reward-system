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
      const response = await firstValueFrom(
        this.authClient.send('validate_token', { token })
      );

      if (!response.isValid) {
        throw new UnauthorizedException('Invalid token');
      }

      // 서비스 가용성 업데이트
      this.healthService.updateServiceStatus('auth', true);
      
      return response.user;
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
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