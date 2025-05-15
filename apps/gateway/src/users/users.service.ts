import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from 'apps/auth/src/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Auth 서비스에 TCP로 메시지 전송
    return firstValueFrom(
      this.authClient.send('create_user', createUserDto)
    );
  }

  async login(loginDto: LoginDto) {
    const response = await firstValueFrom(
      this.authClient.send('login', loginDto)
    );

    if (!response.success) {
      throw new UnauthorizedException(response.message || 'Invalid credentials');
    }

    return {
      user: response.user,
      access_token: response.access_token,
    };
  }

  async validateToken(token: string) {
    const response = await firstValueFrom(
      this.authClient.send('validate_token', { token })
    );

    if (!response.isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    return response.user;
  }

  async updateUserRole(updateRoleDto: UpdateUserRoleDto, adminId: string) {
    return firstValueFrom(
      this.authClient.send('update_user_role', { 
        updateData: updateRoleDto, 
        adminId 
      })
    );
  }

  async findAllUsers() {
    return firstValueFrom(
      this.authClient.send('find_all_users', {})
    );
  }

  async getUserRole(email: string) {
    return firstValueFrom(
      this.authClient.send('get_user_role', email)
    );
  }
}