import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, UseGuards, Request, Put, Headers, Ip, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from 'apps/auth/src/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'libs/database/schema/user.schema';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiHeader } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';

@ApiTags('사용자')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '사용자 등록', description: '새로운 사용자를 등록합니다.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: '사용자 등록 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const result = await this.usersService.create(createUserDto);
    
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    
    return result.data;
  }

  @ApiOperation({ summary: '사용자 로그인', description: '이메일과 비밀번호로 로그인합니다.' })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto, 
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    const result = await this.usersService.login(loginDto, ipAddress, userAgent);
    
    this.logger.debug(`Login result: ${JSON.stringify(result)}`);
    return result;
  }

  @ApiOperation({ summary: '토큰 갱신', description: 'Refresh 토큰을 사용하여 Access 토큰을 갱신합니다.' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiHeader({
    name: 'user-agent',
    description: '브라우저나 앱 등의 클라이언트 정보(자동으로 전송됨)',
    required: false
  })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @Public()
  @Post('refresh-token')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string
  ) {
    try {
      return await this.usersService.refreshToken(refreshTokenDto, ip, userAgent);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @ApiOperation({ summary: '로그아웃', description: '현재 사용자를 로그아웃합니다.' })
  @ApiBearerAuth()
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Body() body: { refreshToken: string }, @Request() req) {
    try {
      const result = await this.usersService.logout(body.refreshToken, req.user._id);
      
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '프로필 조회', description: '현재 로그인한 사용자의 프로필을 조회합니다.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiOperation({ summary: '사용자 역할 변경', description: '사용자의 역할을 변경합니다 (관리자 전용).' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({ status: 200, description: '역할 변경 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @UseGuards(RolesGuard, JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Put('role')
  async updateUserRole(@Body() updateRoleDto: UpdateUserRoleDto, @Request() req) {
    const result = await this.usersService.updateUserRole(updateRoleDto, req.user._id);
    
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    
    return result.user;
  }

  @ApiOperation({ summary: '모든 사용자 조회', description: '모든 사용자 목록을 조회합니다 (관리자 전용).' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @UseGuards(RolesGuard, JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAllUsers() {
    const result = await this.usersService.findAllUsers();
    
    if (!result.success) {
      throw new HttpException(result.message || 'Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    return result.users;
  }

  @ApiOperation({ summary: '사용자 역할 조회', description: '특정 이메일을 가진 사용자의 역할을 조회합니다.' })
  @ApiBearerAuth()
  @ApiParam({ name: 'email', description: '사용자 이메일' })
  @ApiResponse({ status: 200, description: '역할 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
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