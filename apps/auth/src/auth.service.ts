import { ConflictException, Injectable, UnauthorizedException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from 'libs/database/schema/user.schema';
import { RefreshToken } from 'libs/database/schema/refresh-token.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이미 존재하는 사용자인지 확인
    const existingUser = await this.userModel.findOne({ 
      email: createUserDto.email 
    }).exec();
    
    if (existingUser) {
      throw new ConflictException('email already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // 새 사용자 생성
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.USER,
    });
    
    return newUser.save();
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    try {
      const user = await this.userModel.findOne({ email: loginDto.email }).exec();

      if (!user) {
        throw new UnauthorizedException('Invalid email');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // JWT 페이로드 생성
      const payload = { 
        email: user.email, 
        sub: user._id.toString(),
        role: user.role,
        nickname: user.nickname
      };
      
      // 액세스 토큰 생성
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '1h'
      });
      
      // 리프레시 토큰 생성
      const refreshToken = await this.generateRefreshToken(
        user._id.toString(), 
        ipAddress, 
        userAgent
      );
      
      // 비밀번호를 제외한 사용자 정보 반환
      const { password, ...userData } = user.toObject();
      
      return {
        success: true,
        user: userData,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userModel.findById(payload.sub).exec();
      
      if (!user) {
        return { 
          isValid: false,
          message: 'User not found'
        };
      }
      
      const { password, ...userData } = user.toObject();
      
      // 기본 사용자 정보
      const userInfo = {
        _id: userData._id.toString(),
        email: userData.email,
        role: userData.role,
        nickname: userData.nickname,
      };
      
      // 타임스탬프 정보가 있으면 추가
      if ('createdAt' in userData) {
        userInfo['createdAt'] = userData.createdAt;
      }
      
      if ('updatedAt' in userData) {
        userInfo['updatedAt'] = userData.updatedAt;
      }
      
      return { 
        isValid: true,
        user: userInfo
      };
    } catch (error) {
      return { 
        isValid: false,
        message: error.message
      };
    }
  }

  async updateUserRole(data: UpdateUserRoleDto, adminId: string) {
    try {
      // 관리자 권한 확인
      const admin = await this.userModel.findById(adminId).exec();
      if (!admin || admin.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can update user roles');
      }

      // 대상 사용자 찾기
      const user = await this.userModel.findOne({ email: data.email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 자신의 역할은 변경할 수 없음
      if (user._id.toString() === adminId) {
        throw new ForbiddenException('Cannot change your own role');
      }

      // 역할 업데이트
      user.role = data.role;
      await user.save();

      const { password, ...result } = user.toObject();
      return {
        success: true,
        user: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async findAllUsers() {
    const users = await this.userModel.find().exec();
    const result = users.map(user => {
      const { password, ...userData } = user.toObject();
      return userData;
    });
    
    return {
      success: true,
      users: result
    };
  }

  async getUserRole(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    return {
      success: true,
      role: user.role
    };
  }

  // 리프레시 토큰 생성
  async generateRefreshToken(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    // 기존 토큰 모두 비활성화
    await this.refreshTokenModel.updateMany(
      { userId, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );

    // 새 리프레시 토큰 생성
    const token = uuidv4();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7일 유효기간
    
    const refreshToken = new this.refreshTokenModel({
      token,
      userId,
      expires,
      ipAddress,
      userAgent,
    });
    
    await refreshToken.save();
    return token;
  }

  // 토큰 갱신
  async refreshToken(token: string, ipAddress?: string, userAgent?: string) {
    try {
      // 리프레시 토큰 검증
      const refreshToken = await this.refreshTokenModel.findOne({ 
        token,
        revoked: false,
        expires: { $gt: new Date() }
      });
      
      if (!refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // 사용자 조회
      const user = await this.userModel.findById(refreshToken.userId).exec();
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // 새 액세스 토큰 발급
      const payload = { 
        email: user.email, 
        sub: user._id.toString(),
        role: user.role,
        nickname: user.nickname
      };
      
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '1h'
      });
      
      // 새 리프레시 토큰 발급
      const newRefreshToken = await this.generateRefreshToken(
        user._id.toString(), 
        ipAddress, 
        userAgent
      );
      
      // 이전 리프레시 토큰 비활성화
      refreshToken.revoked = true;
      refreshToken.revokedAt = new Date();
      await refreshToken.save();
      
      const { password, ...userData } = user.toObject();
      
      return {
        success: true,
        user: userData,
        access_token: accessToken,
        refresh_token: newRefreshToken
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 로그아웃 (토큰 취소)
  async revokeToken(token: string, userId: string) {
    try {
      const refreshToken = await this.refreshTokenModel.findOne({ 
        token,
        userId
      });
      
      if (!refreshToken) {
        throw new BadRequestException('Invalid token');
      }
      
      // 토큰이 이미 취소되었는지 확인
      if (refreshToken.revoked) {
        return { success: true, message: 'Token already revoked' };
      }
      
      // 토큰 취소
      refreshToken.revoked = true;
      refreshToken.revokedAt = new Date();
      await refreshToken.save();
      
      return { success: true, message: 'Token revoked' };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 서비스 상태 확인을 위한 헬스체크 메서드
  async healthCheck(): Promise<{ status: string, timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
