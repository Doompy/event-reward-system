import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, UseGuards, Request, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from 'apps/auth/src/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'libs/database/schema/user.schema';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.usersService.create(createUserDto);
    
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    
    return result.data;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.usersService.login(loginDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('role')
  async updateUserRole(@Body() updateRoleDto: UpdateUserRoleDto, @Request() req) {
    const result = await this.usersService.updateUserRole(updateRoleDto, req.user._id);
    
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    
    return result.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAllUsers() {
    const result = await this.usersService.findAllUsers();
    
    if (!result.success) {
      throw new HttpException(result.message || 'Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    return result.users;
  }

  @UseGuards(JwtAuthGuard)
  @Get('role/:email')
  async getUserRole(@Param('email') email: string) {
    const result = await this.usersService.getUserRole(email);
    
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.NOT_FOUND);
    }
    
    return { role: result.role };
  }
}