import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RefreshTokenDto } from './dto/token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @MessagePattern('create_user')
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
  async login(@Payload() data: { loginDto: LoginDto, ipAddress?: string, userAgent?: string }) {
    return this.authService.login(data.loginDto, data.ipAddress, data.userAgent);
  }

  @MessagePattern('validate_token')
  async validateToken(@Payload() data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern('refresh_token')
  async refreshToken(@Payload() data: { refreshToken: string, ipAddress?: string, userAgent?: string }) {
    return this.authService.refreshToken(data.refreshToken, data.ipAddress, data.userAgent);
  }

  @MessagePattern('revoke_token')
  async revokeToken(@Payload() data: { token: string, userId: string }) {
    return this.authService.revokeToken(data.token, data.userId);
  }

  @MessagePattern('update_user_role')
  async updateUserRole(@Payload() data: { updateData: UpdateUserRoleDto, adminId: string }) {
    return this.authService.updateUserRole(data.updateData, data.adminId);
  }

  @MessagePattern('find_all_users')
  async findAllUsers() {
    return this.authService.findAllUsers();
  }

  @MessagePattern('get_user_role')
  async getUserRole(@Payload() email: string) {
    return this.authService.getUserRole(email);
  }
}
